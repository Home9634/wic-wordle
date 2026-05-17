export default function VsResults({ state, onBackToMenu, onResetSession }) {
  const outcomeLabel = state.finalOutcome?.outcome === 'local'
    ? 'You win'
    : state.finalOutcome?.outcome === 'opponent'
      ? 'Opponent wins'
      : 'Draw';

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10" onClick={onBackToMenu}>
            Back to menu
          </button>
          <div className="text-right text-sm text-white/60">VS Mode</div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30">
          <h2 className="text-3xl font-bold">{outcomeLabel}</h2>
          <p className="mt-3 text-white/65">
            {state.finalOutcome?.outcome === 'draw'
              ? 'The match ended evenly.'
              : state.finalOutcome?.outcome === 'local'
                ? 'You came out ahead on the chosen scoring mode.'
                : 'Your opponent came out ahead on the chosen scoring mode.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-white/80">
            <span className="rounded-full border border-white/15 px-4 py-2">You: {state.finalOutcome?.localScore ?? 0}</span>
            <span className="rounded-full border border-white/15 px-4 py-2">Opponent: {state.finalOutcome?.opponentScore ?? 0}</span>
          </div>
          <button
            type="button"
            onClick={onResetSession}
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Play again
          </button>
        </div>
      </div>
    </div>
  );
}
