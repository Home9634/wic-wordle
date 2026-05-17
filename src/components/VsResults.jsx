export default function VsResults({ state, onBackToMenu, onResetSession }) {
  const outcomeLabel = state.finalOutcome?.outcome === 'local'
    ? 'You win'
    : state.finalOutcome?.outcome === 'opponent'
      ? 'Opponent wins'
      : 'Draw';

  return (
    <div className="min-h-screen bg-[#1a1a1a] px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex justify-center">
          <button className="bg-slate-500 hover:bg-slate-600 text-white py-2 px-4 rounded cursor-pointer" onClick={onBackToMenu}>
            Back to Menu
          </button>
        </div>
        <h2 className="text-center text-xl">VS Mode</h2>

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
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer"
          >
            Play again
          </button>
        </div>
      </div>
    </div>
  );
}
