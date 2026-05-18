import SearchBar from './SearchBar';
import GuessTable from './GuessTable';
import VsRoundSummary from './VsRoundSummary';
import VsRoundDetailsBar, { VsOpponentMiniBoard } from './VsRoundDetailsBar';
import { getMatchWinner } from '../utils/vsGameHelpers';
import { findPlayerByNameOrAlias } from '../utils/gameLogic';
import { useState, useEffect } from 'react';

export default function VsGame({
  state,
  activeRound,
  activeTarget,
  localGuesses,
  visibleStats,
  onBackToMenu,
  onGuess,
}) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const cooldownSeconds = state.settings.cooldownSeconds ?? 0;
    if (cooldownSeconds <= 0) {
      setCooldownRemaining(0);
      return;
    }

    if (!activeRound?.lastGuessAt) {
      setCooldownRemaining(0);
      return;
    }

    let frameId = null;
    const updateCooldown = () => {
      const now = Date.now();
      const elapsedMs = now - activeRound.lastGuessAt;
      const cooldownMs = cooldownSeconds * 1000;
      const remainingMs = Math.max(0, cooldownMs - elapsedMs);
      setCooldownRemaining(remainingMs);

      if (remainingMs > 0) {
        frameId = requestAnimationFrame(updateCooldown);
      }
    };

    frameId = requestAnimationFrame(updateCooldown);
    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [activeRound?.lastGuessAt, state.settings.cooldownSeconds]);

  const localGuessPlayers = localGuesses
    .map((name) => findPlayerByNameOrAlias(name))
    .filter(Boolean)
    .reverse();

  const matchSummary = getMatchWinner(state.roundStates, state.settings.scoreMode);
  const localRoundsWon = Number.isFinite(matchSummary.localScore) ? matchSummary.localScore : 0;
  const opponentRoundsWon = Number.isFinite(matchSummary.opponentScore) ? matchSummary.opponentScore : 0;

  return (
    <div className="min-h-screen bg-[#1a1a1a] px-3 py-4 text-white sm:px-4">
      <div className="mx-auto flex w-full max-w-full flex-col gap-4">
        <div className="flex justify-center">
          <button className="bg-slate-500 hover:bg-slate-600 text-white py-2 px-4 rounded cursor-pointer" onClick={onBackToMenu}>
            Back to Menu
          </button>
        </div>
        <h2 className="text-center text-xl">VS Mode</h2>

        <div className="rounded-3xl border border-white/10 bg-zinc-800/80 px-3 py-3 shadow-2xl shadow-black/30 sm:px-4">
          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_3px_minmax(0,1fr)] lg:gap-0">
            <div className="lg:pr-8">
              <VsRoundSummary
                side="left"
                nickname={state.nickname}
                score={localRoundsWon}
                rounds={state.roundStates}
                scoreMode={state.settings.scoreMode}
              />
            </div>

            <div className="hidden self-stretch bg-white/25 lg:block" aria-hidden="true" />

            <div className="lg:pl-8">
              <VsRoundSummary
                side="right"
                nickname={state.opponentNickname}
                score={opponentRoundsWon}
                rounds={state.roundStates}
                scoreMode={state.settings.scoreMode}
              />
            </div>
          </div>
        </div>

        <VsRoundDetailsBar
          localGuesses={localGuesses}
          opponentGuesses={activeRound?.opponentGuesses ?? []}
          startedAt={activeRound?.startedAt}
          scoreMode={state.settings.scoreMode}
          timeLimitSeconds={state.settings.scoreMode === 'guesses' ? state.settings.timeLimitSeconds : undefined}
        />

        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="min-w-0 space-y-3 justify-center">
            <div className="flex justify-center items-center gap-3">
              <SearchBar 
                onGuess={onGuess} 
                disabledPlayers={localGuesses}
                cooldownRemaining={cooldownRemaining}
                cooldownSeconds={state.settings.cooldownSeconds}
              />
              {cooldownRemaining > 0 && (
                <div className="flex items-center justify-center rounded-lg border border-orange-400/70 bg-orange-500/10 px-3 py-2 w-16 h-11 text-sm font-semibold text-orange-300">
                  {(cooldownRemaining / 1000).toFixed(1)}s
                </div>
              )}
            </div>
            <GuessTable guesses={localGuessPlayers} target={activeTarget} visibleStats={visibleStats} />
          </div>

          <div className="min-w-0 xl:sticky xl:top-4">
            <VsOpponentMiniBoard
              opponentGuesses={activeRound?.opponentGuesses ?? []}
              target={activeTarget}
              visibleStats={visibleStats}
              opponentLastGuessAt={activeRound?.opponentLastGuessAt}
              cooldownSeconds={state.settings.cooldownSeconds}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
