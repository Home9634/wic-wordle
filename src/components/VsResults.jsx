import VsRoundSummary from './VsRoundSummary';
import GuessTable from './GuessTable';
import { findPlayerByNameOrAlias } from '../utils/gameLogic';

export default function VsResults({ state, onBackToMenu, onResetSession }) {
  const outcomeLabel = state.finalOutcome?.outcome === 'local'
    ? `${state.nickname} Wins!`
    : state.finalOutcome?.outcome === 'opponent'
      ? `${state.opponentNickname} Wins!`
      : 'Draw';

  const localScore = Number.isFinite(state.finalOutcome?.localScore) ? state.finalOutcome.localScore : 0;
  const opponentScore = Number.isFinite(state.finalOutcome?.opponentScore) ? state.finalOutcome.opponentScore : 0;

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
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold">{outcomeLabel}</h3>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_3px_minmax(0,1fr)] lg:gap-0">
            <div className="lg:pr-8">
              <VsRoundSummary
                side="left"
                nickname={state.nickname}
                score={localScore}
                rounds={state.roundStates}
                scoreMode={state.settings.scoreMode}
              />
            </div>

            <div className="hidden self-stretch bg-white/25 lg:block" aria-hidden="true" />

            <div className="lg:pl-8">
              <VsRoundSummary
                side="right"
                nickname={state.opponentNickname}
                score={opponentScore}
                rounds={state.roundStates}
                scoreMode={state.settings.scoreMode}
              />
            </div>
          </div>
        </div>
        {/* Detailed per-round boards */}
        <div className="mt-6 space-y-6">
          {state.roundStates.map((round) => {
            const localGuesses = (round.localGuesses || []).map((n) => findPlayerByNameOrAlias(n)).filter(Boolean);
            const opponentGuesses = (round.opponentGuesses || []).map((n) => findPlayerByNameOrAlias(n)).filter(Boolean);
            const localTime = round.localResult?.timeMs ?? null;
            const opponentTime = round.opponentResult?.timeMs ?? null;

            return (
              <div key={`round-boards-${round.roundIndex}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white/80">Round {round.roundIndex + 1}</div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_3px_minmax(0,1fr)] lg:gap-0">
                  <div className="lg:pr-4">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-sm font-semibold text-white/80">{state.nickname}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white/80">Guesses: {localGuesses.length}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white/80">{localTime != null ? `${(localTime/1000).toFixed(1)}s` : ''}</span>
                    </div>
                    <GuessTable guesses={localGuesses} target={round.target} visibleStats={state.settings.visibleStats} />
                  </div>

                  <div className="hidden self-stretch bg-white/25 lg:block" aria-hidden="true" />

                  <div className="lg:pl-4">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-sm font-semibold text-white/80">{state.opponentNickname}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white/80">Guesses: {opponentGuesses.length}</span>
                      <span className="text-sm font-semibold text-white/80">{opponentTime != null ? `${(opponentTime/1000).toFixed(1)}s` : ''}</span>
                    </div>
                    <GuessTable guesses={opponentGuesses} target={round.target} visibleStats={state.settings.visibleStats} />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onResetSession}
              className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold hover:bg-white/20 cursor-pointer transition"
            >
              Play again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
