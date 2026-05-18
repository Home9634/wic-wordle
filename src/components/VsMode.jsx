import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import VsHome from './VsHome';
import VsGame from './VsGame';
import VsResults from './VsResults';
import { DEFAULT_VISIBLE_STATS, PEER_CONFIG } from './vsModeConstants';
import { loadVsNickname, loadVsSettings, normalizeVsSettings, saveVsNickname, saveVsSettings } from '../utils/vsStorage';
import { getMatchWinner, getRoundMetric } from '../utils/vsGameHelpers';
import { players } from '../data/players';
import { findPlayerByNameOrAlias, getRandomPlayers } from '../utils/gameLogic';

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
const generateLobbyCode = () => String(Math.floor(Math.random() * 900) + 100);

const initialRoundState = (target, roundIndex, randomizedPlayerCount = 0) => {
  const randomPlayers = randomizedPlayerCount > 0 ? getRandomPlayers(randomizedPlayerCount) : [];
  return {
    roundIndex,
    target,
    startedAt: Date.now(),
    localGuesses: randomPlayers.map(p => p.name),
    opponentGuesses: randomPlayers.map(p => p.name),
    localResult: null,
    opponentResult: null,
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
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const stateRef = useRef(state);

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

  const sendMessage = useCallback((payload) => {
    const connection = connectionRef.current;
    if (!connection || !connection.open) return;
    connection.send(payload);
  }, []);

  const teardownNetwork = useCallback((notifyPeer = false) => {
    if (notifyPeer && connectionRef.current?.open) {
      try {
        connectionRef.current.send({ type: 'lobby:close' });
      } catch {
        // ignore
      }
    }

    if (connectionRef.current) {
      try {
        connectionRef.current.close();
      } catch {
        // ignore
      }
      connectionRef.current = null;
    }

    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {
        // ignore
      }
      peerRef.current = null;
    }
  }, []);

  useEffect(() => () => teardownNetwork(false), [teardownNetwork]);

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
            localGuesses: [],
            opponentGuesses: [],
            localResult: null,
            opponentResult: null,
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

  const handleIncomingData = useCallback((data) => {
    if (!data || typeof data !== 'object') return;

    switch (data.type) {
      case 'lobby:hello': {
        setState((previous) => ({
          ...previous,
          connectionState: 'connected',
          opponentNickname: data.nickname || previous.opponentNickname,
          statusMessage: 'Opponent connected.',
          view: 'lobby',
        }));

        const snapshot = stateRef.current;
        sendMessage({
          type: 'lobby:sync',
          nickname: snapshot.nickname,
          settings: snapshot.settings,
          lobbyCode: snapshot.lobbyCode,
        });
        break;
      }
      case 'lobby:sync': {
        setState((previous) => ({
          ...previous,
          connectionState: 'connected',
          opponentNickname: data.nickname || previous.opponentNickname,
          lobbyCode: data.lobbyCode || previous.lobbyCode,
          settings: previous.isHost ? previous.settings : normalizeVsSettings(data.settings ?? previous.settings),
          statusMessage: 'Connected.',
          view: 'lobby',
        }));
        break;
      }
      case 'lobby:update': {
        setState((previous) => (
          previous.isHost
            ? previous
            : {
              ...previous,
              settings: normalizeVsSettings(data.settings ?? previous.settings),
            }
        ));
        break;
      }
      case 'game:start': {
        const incomingRounds = Array.isArray(data.rounds) ? data.rounds : [];
        const nextRounds = incomingRounds.map((roundData, roundIndex) => {
          // Support both old format (just target) and new format (object with target and initialGuesses)
          const roundObj = typeof roundData === 'string' || (roundData && roundData.name) ? { target: roundData } : roundData;
          const target = typeof roundObj.target === 'string'
            ? findPlayerByNameOrAlias(roundObj.target)
            : findPlayerByNameOrAlias(roundObj.target?.name || '') || roundObj.target;
          
          const round = initialRoundState(target || pickRandomTarget(), roundIndex, 0);
          // Apply initial guesses from host if they exist
          if (Array.isArray(roundObj.initialGuesses)) {
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
          settings: previous.isHost ? previous.settings : normalizeVsSettings(data.settings ?? previous.settings),
          statusMessage: 'Match started.',
          rematch: initialRematchState(),
        }));
        break;
      }
      case 'results:ready': {
        if (typeof data.ready !== 'boolean') return;
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
      case 'results:left': {
        setState((previous) => ({
          ...previous,
          rematch: {
            ...(previous.rematch ?? initialRematchState()),
            opponentReady: false,
            opponentLeft: true,
          },
          statusMessage: 'Opponent left the results page.',
        }));
        break;
      }
      case 'game:guess': {
        if (!Number.isInteger(data.roundIndex) || typeof data.guessName !== 'string') return;
        const receivedAt = Date.now();
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
      case 'game:complete': {
        if (!Number.isInteger(data.roundIndex)) return;
        patchRound(data.roundIndex, (round) => ({
          ...round,
          opponentResult: {
            guessCount: Number(data.guessCount) || 0,
            timeMs: Number(data.timeMs) || 0,
          },
        }));
        break;
      }
      case 'lobby:close': {
        teardownNetwork(false);
        setState((previous) => ({
          ...previous,
          view: 'home',
          connectionState: 'idle',
          lobbyCode: '',
          opponentNickname: 'Opponent',
          roundStates: [],
          currentRoundIndex: 0,
          finalOutcome: null,
          settings: previous.isHost ? previous.settings : loadVsSettings(),
          statusMessage: 'Opponent disconnected.',
        }));
        break;
      }
      default:
        break;
    }
  }, [patchRound, sendMessage, teardownNetwork]);

  const establishConnection = useCallback((connection) => {
    connectionRef.current = connection;

    connection.on('data', handleIncomingData);
    connection.on('close', () => {
      connectionRef.current = null;
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
    });

    connection.on('error', () => {
      setState((previous) => ({
        ...previous,
        connectionState: 'idle',
        statusMessage: 'Connection error.',
      }));
    });
  }, [handleIncomingData]);

  useEffect(() => {
    if (state.view !== 'game') return;
    if (!activeRound || activeRound.winner) return;

    const shouldResolve = state.settings.scoreMode === 'time'
      ? Boolean(activeRound.localResult || activeRound.opponentResult)
      : Boolean(activeRound.localResult && activeRound.opponentResult);

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
          sendMessage({
            type: 'lobby:update',
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

  const createHostLobby = () => {
    teardownNetwork(false);

    const tryCreate = (attempt = 0) => {
      const code = generateLobbyCode();
      const peer = new Peer(code, PEER_CONFIG);
      peerRef.current = peer;

      setState((previous) => ({
        ...previous,
        isHost: true,
        view: 'lobby',
        lobbyCode: code,
        connectionState: 'connecting',
        statusMessage: 'Creating lobby...',
        opponentNickname: 'Waiting...',
      }));

      peer.on('open', (peerId) => {
        setState((previous) => ({
          ...previous,
          connectionState: 'waiting',
          lobbyCode: peerId,
          statusMessage: `Lobby ready. Share code ${peerId}`,
        }));
      });

      peer.on('connection', (connection) => {
        if (connectionRef.current) {
          connection.close();
          return;
        }

        establishConnection(connection);
        connection.on('open', () => {
          setState((previous) => ({
            ...previous,
            connectionState: 'connected',
            statusMessage: 'Opponent connected.',
          }));
        });
      });

      peer.on('error', (error) => {
        if (error?.type === 'unavailable-id' && attempt < 8) {
          try {
            peer.destroy();
          } catch {
            // ignore
          }
          tryCreate(attempt + 1);
          return;
        }

        setState((previous) => ({
          ...previous,
          connectionState: 'idle',
          view: 'home',
          lobbyCode: '',
          statusMessage: error?.message || 'Could not create lobby.',
        }));
      });
    };

    tryCreate();
  };

  const joinLobby = () => {
    const code = state.joinCode.trim();
    if (!/^\d{3}$/.test(code)) {
      setState((previous) => ({ ...previous, statusMessage: 'Enter a valid 3-digit lobby code.' }));
      return;
    }

    teardownNetwork(false);
    const peer = new Peer(undefined, PEER_CONFIG);
    peerRef.current = peer;

    setState((previous) => ({
      ...previous,
      isHost: false,
      connectionState: 'connecting',
      statusMessage: 'Joining lobby...',
      lobbyCode: code,
      view: 'join',
      opponentNickname: 'Host',
    }));

    peer.on('open', () => {
      const connection = peer.connect(code, { reliable: true });
      let timeout = window.setTimeout(() => {
        try {
          connection.close();
        } catch {
          // ignore
        }
        teardownNetwork(false);
        setState((previous) => ({
          ...previous,
          connectionState: 'idle',
          statusMessage: 'Could not find that lobby code.',
          view: 'join',
        }));
      }, 7000);

      connection.on('open', () => {
        window.clearTimeout(timeout);
        establishConnection(connection);
        setState((previous) => ({
          ...previous,
          view: 'lobby',
          connectionState: 'connected',
          statusMessage: 'Connected.',
        }));
        sendMessage({
          type: 'lobby:hello',
          nickname: stateRef.current.nickname,
        });
      });

      connection.on('error', () => {
        window.clearTimeout(timeout);
      });

      connection.on('close', () => {
        window.clearTimeout(timeout);
      });
    });

    peer.on('error', (error) => {
      setState((previous) => ({
        ...previous,
        connectionState: 'idle',
        statusMessage: error?.message || 'Could not join lobby.',
      }));
    });
  };

  const startMatch = () => {
    if (!state.isHost) return;
    const rounds = Array.from({ length: state.settings.rounds }, (_, roundIndex) => initialRoundState(pickRandomTarget(), roundIndex, state.settings.randomizedPlayerCount));

    setState((previous) => ({
      ...previous,
      view: 'game',
      currentRoundIndex: 0,
      roundStates: rounds,
      finalOutcome: null,
      rematch: initialRematchState(),
      statusMessage: 'Match started.',
    }));

    sendMessage({
      type: 'game:start',
      settings: state.settings,
      rounds: rounds.map((round) => ({
        target: round.target,
        initialGuesses: round.localGuesses,
      })),
    });
  };

  const handlePlayAgain = () => {
    setState((previous) => {
      const nextReady = !Boolean(previous.rematch?.localReady);
      const nextRematch = {
        ...(previous.rematch ?? initialRematchState()),
        localReady: nextReady,
        localLeft: false,
      };

      window.setTimeout(() => {
        sendMessage({
          type: 'results:ready',
          ready: nextReady,
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
    if (!player || !activeRound || activeRound.localResult) return;

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

    sendMessage({
      type: 'game:guess',
      roundIndex: state.currentRoundIndex,
      guessName: player.name,
    });

    if (activeTarget && player.name === activeTarget.name) {
      sendMessage({
        type: 'game:complete',
        roundIndex: state.currentRoundIndex,
        guessCount: nextGuesses.length,
        timeMs,
      });
    }
  };

  const handleBackToMenu = () => {
    if (state.view === 'results') {
      sendMessage({ type: 'results:left' });
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

    teardownNetwork(true);
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
      />
    );
  }

  // Home/lobby/join/create views
  return (
    <VsHome
      state={state}
      visibleStats={visibleStats}
      onBackToMenu={handleBackToMenu}
      onNicknameChange={(event) => setState((previous) => ({ ...previous, nickname: event.target.value }))}
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
