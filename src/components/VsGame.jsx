import SearchBar from './SearchBar';
import GuessTable from './GuessTable';
import VsRoundSummary from './VsRoundSummary';
import { getMatchWinner } from '../utils/vsGameHelpers';
import { findPlayerByNameOrAlias } from '../utils/gameLogic';

export default function VsGame({
  state,
  tick,
  activeRound,
  activeTarget,
  localGuesses,
  visibleStats,
  onBackToMenu,
  onGuess,
}) {
  const roundElapsed = activeRound?.startedAt ? tick - activeRound.startedAt : 0;

  const localGuessPlayers = localGuesses
    .map((name) => findPlayerByNameOrAlias(name))
    .filter(Boolean)
    .reverse();

  const matchSummary = getMatchWinner(state.roundStates, state.settings.scoreMode);
  const localRoundsWon = Number.isFinite(matchSummary.localScore) ? matchSummary.localScore : 0;
  const opponentRoundsWon = Number.isFinite(matchSummary.opponentScore) ? matchSummary.opponentScore : 0;

  return (
    <div className="min-h-screen bg-[#090909] px-3 py-4 text-white sm:px-4">
      <div className="mx-auto flex w-full max-w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10" onClick={onBackToMenu}>
            Back to menu
          </button>
          <div className="text-right text-xs uppercase tracking-[0.3em] text-white/45">VS Mode</div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 px-3 py-3 shadow-2xl shadow-black/30 sm:px-4">
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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(280px,0.9fr)]">
          <div className="min-w-0 space-y-3 justify-center">
            <div className="flex justify-center">
              <SearchBar onGuess={onGuess} disabledPlayers={localGuesses} />
            </div>
            <GuessTable guesses={localGuessPlayers} target={activeTarget} visibleStats={visibleStats} />
          </div>

          <div className="min-w-0 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/75">
              <div className="mb-2 text-xs uppercase tracking-[0.25em] text-white/45">Round details</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/60">Round</span>
                  <span className="font-semibold text-white">{state.currentRoundIndex + 1} / {state.roundStates.length || 0}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/60">Current pace</span>
                  <span className="font-semibold text-white">
                    {state.settings.scoreMode === 'time' ? `${(roundElapsed / 1000).toFixed(1)}s` : `${localGuesses.length} guesses`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/60">Win con</span>
                  <span className="font-semibold text-white">Rounds won</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-white/60">
              Live opponent data is synced over PeerJS in real time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
