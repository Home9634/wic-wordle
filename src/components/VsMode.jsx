import { useCallback, useEffect, useRef, useState } from 'react';
import VsHome from './VsHome';
import VsGame from './VsGame';
import VsResults from './VsResults';
import { DEFAULT_VISIBLE_STATS, WS_BACKEND_URL } from './vsModeConstants';
import { loadVsNickname, loadVsSettings, normalizeVsSettings, saveVsNickname, saveVsSettings } from '../utils/vsStorage';
import { getMatchWinner, getRoundMetric } from '../utils/vsGameHelpers';
import { players } from '../data/players';
import { findPlayerByNameOrAlias, getRandomPlayers } from '../utils/gameLogic';
import useWsLobby from '../hooks/useWsLobby';

const DEBUG_MODE = false;

const debugState = {
  view: 'game',
  nickname: 'DevPlayer',
  opponentNickname: 'MockOpponent',
  connectionState: 'connected',
  isHost: true,
  settings: {
    matchMode: 'round',
    scoreMode: 'time',
    rounds: 3,
    // visibleStats: ['name', 'debut', 'canonWins'] // Test hidden stats here
  },
  currentRoundIndex: 0,
  roundStates: [
    {
      roundIndex: 0,
      target: players[0], // AilbheWolfe or whoever
      startedAt: Date.now() - 30000,
      localGuesses: [players[1].name], // Haxrex8
      opponentGuesses: ['KillerMeow', 'Blucoyo'], // Fake names
      localResult: null,
      opponentResult: null,
      winner: null,
    },
    {
      roundIndex: 1,
      target: players[4], // AilbheWolfe or whoever
      startedAt: Date.now() - 30000,
      localGuesses: [players[1].name], // Haxrex8
      opponentGuesses: ['KillerMeow', 'Blucoyo'], // Fake names
      localResult: null,
      opponentResult: null,
      winner: null,
    },
    // ... add more mock rounds if needed
  ],
};

const pickRandomTarget = () => players[Math.floor(Math.random() * players.length)];

const initialRoundState = (target, roundIndex, randomizedPlayerCount = 0) => {
  const randomPlayers = randomizedPlayerCount > 0 ? getRandomPlayers(randomizedPlayerCount, target) : [];
  return {
    roundIndex,
    target,
    startedAt: Date.now(),
    localGuesses: randomPlayers.map(p => p.name),
    opponentGuesses: randomPlayers.map(p => p.name),
    localResult: null,
    opponentResult: null,
    localSurrendered: false,
    opponentSurrendered: false,
    winner: null,
    lastGuessAt: null,
    opponentLastGuessAt: null,
  };
};

const initialRematchState = () => ({
  localReady: false,
  opponentReady: false,
  localLeft: false,
  opponentLeft: false,
});

const defaultState = () => ({
  view: 'home',
  nickname: loadVsNickname(),
  opponentNickname: 'Opponent',
  statusMessage: '',
  connectionState: 'idle',
  isHost: false,
  lobbyCode: '',
  joinCode: '',
  settings: loadVsSettings(),
  currentRoundIndex: 0,
  roundStates: [],
  finalOutcome: null,
  rematch: initialRematchState(),
});

export default function VsMode({ onBack }) {
  const [state, setState] = useState(() => (DEBUG_MODE ? debugState : defaultState()));
  const stateRef = useRef(state);
  // websocket refs and functions are provided by useWsLobby below
  let connectionRef = null;
  let socketRef = null;
  

  const activeRound = state.roundStates[state.currentRoundIndex] ?? null;
  const localGuesses = activeRound?.localGuesses ?? [];
  const activeTarget = activeRound?.target ?? null;
  const visibleStats = state.settings?.visibleStats?.length > 0 ? state.settings.visibleStats : DEFAULT_VISIBLE_STATS;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    saveVsNickname(state.nickname);
  }, [state.nickname]);

  useEffect(() => {
    if (!state.isHost && state.connectionState === 'connected') return;
    saveVsSettings(state.settings);
  }, [state.connectionState, state.isHost, state.settings]);

  // stable refs used to forward hook implementations once the hook is created
  const sendRef = useRef(() => {});
  const teardownRef = useRef(() => {});

  const sendMessage = useCallback((type, data = {}) => sendRef.current(type, data), []);
  const teardownNetwork = useCallback((notifyPeer = false, reason = 'manual') => teardownRef.current(notifyPeer, reason), []);

  // websocket functions are provided by the `useWsLobby` hook below

  const patchRound = useCallback((roundIndex, updater) => {
    setState((previous) => ({
      ...previous,
      roundStates: previous.roundStates.map((round, index) => (
        index === roundIndex ? updater(round) : round
      )),
    }));
  }, []);

  const resolveCurrentRound = useCallback(() => {
    setState((previous) => {
      if (previous.view !== 'game') return previous;

      const current = previous.roundStates[previous.currentRoundIndex];
      if (!current || current.winner) return previous;

      const localMetric = current.localResult ? getRoundMetric(current.localResult, previous.settings.scoreMode) : Number.POSITIVE_INFINITY;
      const opponentMetric = current.opponentResult ? getRoundMetric(current.opponentResult, previous.settings.scoreMode) : Number.POSITIVE_INFINITY;

      let winner = 'draw';
      if (previous.settings.scoreMode === 'time') {
        if (localMetric !== Number.POSITIVE_INFINITY && opponentMetric !== Number.POSITIVE_INFINITY) {
          winner = localMetric === opponentMetric ? 'draw' : localMetric < opponentMetric ? 'local' : 'opponent';
        } else if (localMetric !== Number.POSITIVE_INFINITY) {
          winner = 'local';
        } else if (opponentMetric !== Number.POSITIVE_INFINITY) {
          winner = 'opponent';
        }
      } else {
        winner = localMetric === opponentMetric ? 'draw' : localMetric < opponentMetric ? 'local' : 'opponent';
      }

      const resolvedRounds = previous.roundStates.map((round, index) => (
        index === previous.currentRoundIndex ? { ...round, winner } : round
      ));

      const nextRoundIndex = previous.currentRoundIndex + 1;
      if (nextRoundIndex >= resolvedRounds.length) {
        return {
          ...previous,
          roundStates: resolvedRounds,
          finalOutcome: getMatchWinner(resolvedRounds, previous.settings.scoreMode),
          rematch: initialRematchState(),
          view: 'results',
        };
      }

      const activatedRounds = resolvedRounds.map((round, index) => (
        index === nextRoundIndex
          ? {
            ...round,
            startedAt: Date.now(),
            // Preserve any preselected randomized guesses that were set at match start
            localGuesses: Array.isArray(round.localGuesses) && round.localGuesses.length > 0 ? round.localGuesses : [],
            opponentGuesses: Array.isArray(round.opponentGuesses) && round.opponentGuesses.length > 0 ? round.opponentGuesses : [],
            localResult: null,
            opponentResult: null,
            localSurrendered: false,
            opponentSurrendered: false,
            winner: null,
            lastGuessAt: null,
            opponentLastGuessAt: null,
          }
          : round
      ));

      return {
        ...previous,
        roundStates: activatedRounds,
        currentRoundIndex: nextRoundIndex,
      };
    });
  }, []);

  const startMatch = useCallback(() => {
    const currentState = stateRef.current;
    if (!currentState.isHost) return;

    const requestedRounds = Number.isInteger(currentState.settings.rounds) ? currentState.settings.rounds : 3;
    const availablePlayers = players.length;

    let targets = [];
    if (availablePlayers >= requestedRounds) {
      targets = getRandomPlayers(requestedRounds);
    } else {
      targets = Array.from({ length: requestedRounds }, () => ({ target: pickRandomTarget() }));
      targets = targets.map((t) => t.target || t);
    }

    const rounds = targets.map((t, roundIndex) => initialRoundState(t, roundIndex, currentState.settings.randomizedPlayerCount));

    setState((previous) => ({
      ...previous,
      view: 'game',
      currentRoundIndex: 0,
      roundStates: rounds,
      finalOutcome: null,
      rematch: initialRematchState(),
      statusMessage: 'Match started.',
    }));

    sendMessage('game:start', {
      settings: currentState.settings,
      lobbyCode: currentState.lobbyCode,
      rounds: rounds.map((round, roundIndex) => ({
        roundIndex,
        target: round.target,
        initialGuesses: round.localGuesses,
      })),
    });
  }, [sendMessage]);

  const handleIncomingData = useCallback((message) => {
    if (!message || typeof message !== 'object') return;

    const data = message.data ?? {};
    const ownRole = stateRef.current.isHost ? 'host' : 'guest';
    console.log('Received message:', message.type, data);

    switch (message.type) {
      case 'lobby:created': {
        setState((previous) => ({
          ...previous,
          isHost: true,
          view: 'lobby',
          lobbyCode: data.lobbyCode || previous.lobbyCode,
          connectionState: 'waiting',
          opponentNickname: 'Waiting...',
          statusMessage: data.message || (data.lobbyCode ? `Lobby ready. Share code ${data.lobbyCode}` : 'Lobby ready.'),
        }));

        const snapshot = stateRef.current;
        sendMessage('lobby:sync', {
          nickname: snapshot.nickname,
          settings: snapshot.settings,
          lobbyCode: data.lobbyCode || snapshot.lobbyCode,
        });
        break;
      } 
      case 'lobby:joined': {
        setState((previous) => ({
          ...previous,
          view: 'lobby',
          connectionState: 'connected',
          lobbyCode: data.lobbyCode || previous.lobbyCode,
          opponentNickname: data.hostNickname || data.opponentNickname || previous.opponentNickname,
          statusMessage: data.message || 'Connected.',
          settings: data.settings ? { ...previous.settings, ...data.settings } : previous.settings,
        }));
        break;
      }
      case 'opponent:joined': {
        setState((previous) => ({
          ...previous,
          connectionState: 'connected',
          opponentNickname: data.opponentNickname || previous.opponentNickname,
          statusMessage: 'Opponent connected.',
          view: 'lobby',
        }));
        break;
      }
      case 'lobby:sync': {
        setState((previous) => ({
          ...previous,
          connectionState: 'connected',
          opponentNickname: data.nickname || data.hostNickname || data.opponentNickname || previous.opponentNickname,
          lobbyCode: data.lobbyCode || previous.lobbyCode,
          settings: data.settings ? { ...previous.settings, ...data.settings } : previous.settings,
          statusMessage: 'Connected.',
          view: 'lobby',
        }));
        break;
      }
      case 'lobby:update': {
        setState((previous) => {
          const nextState = { ...previous };

          if (typeof data.nickname === 'string' && (!data.submittedBy || data.submittedBy !== ownRole)) {
            nextState.opponentNickname = data.nickname || nextState.opponentNickname;
          }

          if (!previous.isHost) {
            nextState.settings = normalizeVsSettings(data.settings ?? previous.settings);
          }

          return nextState;
        });
        break;
      }
      case 'nickname:update': {
        if (typeof data.nickname !== 'string') return;
        if (data.submittedBy && data.submittedBy === ownRole) return;

        setState((previous) => ({
          ...previous,
          opponentNickname: data.nickname || previous.opponentNickname,
          statusMessage: previous.view === 'lobby' ? 'Opponent updated their nickname.' : previous.statusMessage,
        }));
        break;
      }
      case 'game:start': {
        const incomingRounds = Array.isArray(data.rounds) ? data.rounds : [];
        const nextSettings = normalizeVsSettings(data.settings ?? stateRef.current.settings);
        const nextRounds = incomingRounds.map((roundData, roundIndex) => {
          const roundObj = typeof roundData === 'string' || (roundData && roundData.name) ? { target: roundData } : roundData;
          const target = typeof roundObj?.target === 'string'
            ? findPlayerByNameOrAlias(roundObj.target)
            : findPlayerByNameOrAlias(roundObj?.target?.name || '') || roundObj?.target;

          const round = initialRoundState(target || pickRandomTarget(), roundIndex, 0);
          if (Array.isArray(roundObj?.initialGuesses)) {
            round.localGuesses = roundObj.initialGuesses;
            round.opponentGuesses = roundObj.initialGuesses;
          }
          return round;
        });

        setState((previous) => ({
          ...previous,
          view: 'game',
          currentRoundIndex: 0,
          roundStates: nextRounds,
          finalOutcome: null,
          settings: nextSettings,
          statusMessage: 'Match started.',
          rematch: initialRematchState(),
        }));
        break;
      }
      case 'results:ready':
      case 'rematch:ready': {
        if (typeof data.ready !== 'boolean') return;
        if (data.submittedBy && data.submittedBy === ownRole) return;

        setState((previous) => {
          const nextRematch = {
            ...(previous.rematch ?? initialRematchState()),
            opponentReady: data.ready,
            opponentLeft: false,
          };

          const nextState = {
            ...previous,
            rematch: nextRematch,
          };

          if (previous.isHost && previous.view === 'results' && nextRematch.localReady && nextRematch.opponentReady && !nextRematch.localLeft && !nextRematch.opponentLeft) {
            window.setTimeout(() => startMatch(), 0);
          }

          return nextState;
        });
        break;
      }
      case 'results:left':
      case 'match:left':
      case 'match:abandoned':
      case 'lobby:close': {
        setState((previous) => {
          const inResults = previous.view === 'results';
          return {
            ...previous,
            connectionState: 'idle',
            statusMessage: message.type === 'match:abandoned'
              ? 'Opponent disconnected.'
              : 'Opponent left.',
            view: inResults ? 'results' : 'home',
            lobbyCode: inResults ? previous.lobbyCode : '',
            roundStates: inResults ? previous.roundStates : [],
            currentRoundIndex: inResults ? previous.currentRoundIndex : 0,
            finalOutcome: inResults ? previous.finalOutcome : null,
            opponentNickname: inResults ? previous.opponentNickname : 'Opponent',
            rematch: inResults
              ? {
                ...(previous.rematch ?? initialRematchState()),
                opponentReady: false,
                opponentLeft: true,
              }
              : initialRematchState(),
            settings: previous.isHost ? previous.settings : loadVsSettings(),
          };
        });
        break;
      }
      case 'game:guess': {
        if (!Number.isInteger(data.roundIndex) || typeof data.guessName !== 'string') return;
        if (data.submittedBy && data.submittedBy === ownRole) return;

        const receivedAt = Number(data.submittedAt) || Date.now();
        const isTimeMode = stateRef.current?.settings?.scoreMode === 'time';
        patchRound(data.roundIndex, (round) => (
          round.opponentGuesses.includes(data.guessName)
            ? round
            : {
              ...round,
              opponentGuesses: [...round.opponentGuesses, data.guessName],
              opponentLastGuessAt: isTimeMode ? receivedAt : round.opponentLastGuessAt,
            }
        ));
        break;
      }
      case 'game:surrender': {
        if (!Number.isInteger(data.roundIndex)) return;
        if (data.submittedBy && data.submittedBy === ownRole) return;

        patchRound(data.roundIndex, (round) => ({
          ...round,
          opponentSurrendered: true,
        }));
        break;
      }
      case 'game:complete': {
        if (!Number.isInteger(data.roundIndex)) return;
        if (data.submittedBy && data.submittedBy === ownRole) return;

        patchRound(data.roundIndex, (round) => ({
          ...round,
          opponentResult: {
            guessCount: Number(data.result?.guessCount ?? data.guessCount) || 0,
            timeMs: Number(data.result?.timeMs ?? data.timeMs) || 0,
          },
        }));
        break;
      }
      case 'error': {
        teardownNetwork(false, 'error');
        setState((previous) => ({
          ...previous,
          connectionState: 'idle',
          view: previous.view === 'join' ? 'join' : 'home',
          statusMessage: data.message || 'Connection error.',
          lobbyCode: previous.view === 'join' ? previous.lobbyCode : '',
        }));
        break;
      }
      default:
        break;
    }
  }, [patchRound, sendMessage, startMatch, teardownNetwork]);

  // --- wire websocket hook after handlers are defined ---
  const onSocketClose = useCallback(() => {
    setState((previous) => ({
      ...previous,
      connectionState: 'idle',
      statusMessage: previous.view === 'results'
        ? 'Opponent left the results page.'
        : previous.view === 'game'
          ? 'Connection lost during match.'
          : 'Connection closed.',
      view: previous.view === 'results' ? 'results' : 'home',
      lobbyCode: previous.view === 'results' ? previous.lobbyCode : '',
      roundStates: previous.view === 'results' ? previous.roundStates : [],
      currentRoundIndex: previous.view === 'results' ? previous.currentRoundIndex : 0,
      finalOutcome: previous.view === 'results' ? previous.finalOutcome : null,
      opponentNickname: previous.view === 'results' ? previous.opponentNickname : 'Opponent',
      rematch: previous.view === 'results'
        ? {
          ...(previous.rematch ?? initialRematchState()),
          opponentReady: false,
          opponentLeft: true,
        }
        : initialRematchState(),
      settings: previous.isHost ? previous.settings : loadVsSettings(),
    }));
  }, []);

  const onSocketError = useCallback(() => {
    setState((previous) => ({
      ...previous,
      connectionState: 'idle',
      statusMessage: 'Connection error.',
    }));
  }, []);

  const ws = useWsLobby({ onMessage: handleIncomingData, onClose: onSocketClose, onError: onSocketError });
  const connectionRefLocal = ws.connectionRef;
  const socketRefLocal = ws.socketRef;
  const connectBackend = ws.connectBackend;

  useEffect(() => {
    sendRef.current = ws.sendMessage;
    teardownRef.current = ws.teardownNetwork;
  }, [ws]);

  // expose connection/socket refs with the expected .current shape
  connectionRef = connectionRefLocal;
  socketRef = socketRefLocal;

  useEffect(() => {
    if (state.view !== 'game') return;
    if (!activeRound || activeRound.winner) return;

    const localEnded = Boolean(activeRound.localResult || activeRound.localSurrendered);
    const opponentEnded = Boolean(activeRound.opponentResult || activeRound.opponentSurrendered);

    const shouldResolve = state.settings.scoreMode === 'time'
      ? Boolean(
        activeRound.localResult
        || activeRound.opponentResult
        || (activeRound.localSurrendered && activeRound.opponentSurrendered)
      )
      : Boolean(localEnded && opponentEnded);

    if (!shouldResolve) return;

    const resolveDelay = state.settings.scoreMode === 'time' ? 300 : 900;

    const timer = window.setTimeout(() => {
      resolveCurrentRound();
    }, resolveDelay);

    return () => window.clearTimeout(timer);
  }, [activeRound, resolveCurrentRound, state.settings.scoreMode, state.settings.timeLimitSeconds, state.view]);

  useEffect(() => {
    if (state.view !== 'game') return;
    if (state.settings.scoreMode !== 'guesses') return;
    if (!activeRound || activeRound.winner) return;
    if (!activeRound.startedAt) return;

    const timeLimitMs = (state.settings.timeLimitSeconds || 0) * 1000;
    const elapsedMs = Date.now() - activeRound.startedAt;
    const remainingMs = Math.max(0, timeLimitMs - elapsedMs);

    const timer = window.setTimeout(() => {
      resolveCurrentRound();
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [activeRound, resolveCurrentRound, state.settings.scoreMode, state.settings.timeLimitSeconds, state.view]);

  const updateSettings = (patch) => {
    setState((previous) => {
      const nextSettings = normalizeVsSettings({ ...previous.settings, ...patch });
      if (previous.view === 'lobby' && previous.isHost) {
        window.setTimeout(() => {
          sendMessage('lobby:update', {
            lobbyCode: previous.lobbyCode,
            settings: nextSettings,
          });
        }, 0);
      }

      return {
        ...previous,
        settings: nextSettings,
      };
    });
  };

  const handleNicknameChange = (event) => {
    const nextNickname = event.target.value;

    setState((previous) => ({
      ...previous,
      nickname: nextNickname,
    }));

    if (connectionRef.current?.readyState === WebSocket.OPEN && stateRef.current.connectionState !== 'idle') {
      sendMessage('nickname:update', {
        nickname: nextNickname,
        lobbyCode: stateRef.current.lobbyCode,
      });
    }
  };

  const createHostLobby = () => {
    connectBackend(() => {
      sendMessage('lobby:create', {
        nickname: stateRef.current.nickname,
      });

      setState((previous) => ({
        ...previous,
        isHost: true,
        view: 'lobby',
        connectionState: 'connecting',
        statusMessage: 'Creating lobby...',
        opponentNickname: 'Waiting...',
      }));
    });
  };

  const joinLobby = () => {
    const code = state.joinCode.trim();
    if (!/^\d{3}$/.test(code)) {
      setState((previous) => ({ ...previous, statusMessage: 'Enter a valid 3-digit lobby code.' }));
      return;
    }

    connectBackend(() => {
      sendMessage('lobby:join', {
        lobbyCode: code,
        nickname: stateRef.current.nickname,
      });

      setState((previous) => ({
        ...previous,
        isHost: false,
        connectionState: 'connecting',
        statusMessage: 'Joining lobby...',
        lobbyCode: code,
        view: 'join',
        opponentNickname: 'Host',
      }));
    });
  };

  const handlePlayAgain = () => {
    setState((previous) => {
      const nextReady = !previous.rematch?.localReady;
      const nextRematch = {
        ...(previous.rematch ?? initialRematchState()),
        localReady: nextReady,
        localLeft: false,
      };

      window.setTimeout(() => {
        sendMessage('rematch:ready', {
          ready: nextReady,
          lobbyCode: previous.lobbyCode,
        });

        if (previous.isHost && previous.view === 'results' && nextReady && nextRematch.opponentReady && !nextRematch.localLeft && !nextRematch.opponentLeft) {
          startMatch();
        }
      }, 0);

      return {
        ...previous,
        rematch: nextRematch,
      };
    });
  };

  const handleGuess = (playerName) => {
    const player = findPlayerByNameOrAlias(playerName);
    if (!player || !activeRound || activeRound.localResult || activeRound.localSurrendered) return;

    // Only enforce cooldown and record lastGuessAt when in time score mode
    const isTimeMode = stateRef.current?.settings?.scoreMode === 'time';
    const cooldownMs = isTimeMode ? Math.max(0, Number(stateRef.current.settings.cooldownSeconds || 0) * 1000) : 0;

    if (cooldownMs > 0 && isTimeMode && activeRound.lastGuessAt) {
      const elapsedSinceLastGuess = Date.now() - activeRound.lastGuessAt;
      if (elapsedSinceLastGuess < cooldownMs) return;
    }

    const nextGuesses = activeRound.localGuesses.includes(player.name)
      ? activeRound.localGuesses
      : [...activeRound.localGuesses, player.name];

    const now = Date.now();
    const timeMs = activeRound.startedAt ? now - activeRound.startedAt : 0;

    setState((previous) => {
      const round = previous.roundStates[previous.currentRoundIndex];
      if (!round) return previous;

      const localResult = player.name === round.target?.name
        ? { guessCount: nextGuesses.length, timeMs }
        : round.localResult;

      const nextRounds = previous.roundStates.map((entry, index) => (
        index === previous.currentRoundIndex
          ? {
            ...entry,
            localGuesses: nextGuesses,
            localResult,
            lastGuessAt: previous.settings.scoreMode === 'time' ? now : entry.lastGuessAt,
          }
          : entry
      ));

      return {
        ...previous,
        roundStates: nextRounds,
      };
    });

    sendMessage('game:guess', {
      lobbyCode: state.lobbyCode,
      roundIndex: state.currentRoundIndex,
      guessName: player.name,
    });

    if (activeTarget && player.name === activeTarget.name) {
      sendMessage('game:complete', {
        lobbyCode: state.lobbyCode,
        roundIndex: state.currentRoundIndex,
        guessCount: nextGuesses.length,
        timeMs,
      });
    }
  };

  const handleSurrenderRound = () => {
    if (!activeRound || activeRound.localResult || activeRound.localSurrendered || activeRound.winner) return;

    setState((previous) => {
      const round = previous.roundStates[previous.currentRoundIndex];
      if (!round || round.localResult || round.localSurrendered || round.winner) return previous;

      const nextRounds = previous.roundStates.map((entry, index) => (
        index === previous.currentRoundIndex
          ? {
            ...entry,
            localSurrendered: true,
          }
          : entry
      ));

      return {
        ...previous,
        roundStates: nextRounds,
      };
    });

    sendMessage('game:surrender', {
      roundIndex: state.currentRoundIndex,
      lobbyCode: state.lobbyCode,
    });
  };

  const handleBackToMenu = () => {
    if (state.view === 'results') {
      teardownNetwork(true, 'results:left');
      setState((previous) => ({
        ...previous,
        view: 'home',
        statusMessage: 'You left the results page.',
        rematch: {
          ...(previous.rematch ?? initialRematchState()),
          localReady: false,
          localLeft: true,
        },
      }));
      return;
    }

    teardownNetwork(true, 'left:lobby');
    if (typeof onBack === 'function') onBack();
  };

  const resetSession = () => {
    teardownNetwork(true);
    setState((previous) => ({
      ...defaultState(),
      nickname: previous.nickname,
      settings: previous.isHost ? previous.settings : loadVsSettings(),
    }));
  };

  // Route to appropriate page component
  if (state.view === 'results') {
    return (
      <VsResults
        state={state}
        onBackToMenu={handleBackToMenu}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  if (state.view === 'game') {
    return (
      <VsGame
        state={state}
        activeRound={activeRound}
        activeTarget={activeTarget}
        localGuesses={localGuesses}
        visibleStats={visibleStats}
        onBackToMenu={handleBackToMenu}
        onGuess={handleGuess}
        onSurrenderRound={handleSurrenderRound}
      />
    );
  }

  // Home/lobby/join/create views
  return (
    <VsHome
      state={state}
      visibleStats={visibleStats}
      onBackToMenu={handleBackToMenu}
      onNicknameChange={handleNicknameChange}
      onJoinCodeChange={(event) => setState((previous) => ({ ...previous, joinCode: event.target.value }))}
      onViewChange={(newView) => setState((previous) => ({ ...previous, view: newView, statusMessage: '' }))}
      onUpdateSettings={updateSettings}
      onCreateLobby={createHostLobby}
      onJoinLobby={joinLobby}
      onStartMatch={startMatch}
      onResetSession={resetSession}
    />
  );
}
