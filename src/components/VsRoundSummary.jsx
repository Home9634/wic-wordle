const getSquareState = (round, side) => {
  const isLocalSide = side === 'left';

  if (round.winner === 'draw') {
    return {
      borderClass: 'border-orange-400/70 bg-orange-500/10',
      fillClass: 'bg-transparent',
    };
  }

  if (!round.winner) {
    return {
      borderClass: 'border-white/15 bg-transparent',
      fillClass: 'bg-transparent',
    };
  }

  const wonBySide = isLocalSide ? round.winner === 'local' : round.winner === 'opponent';

  return {
    borderClass: wonBySide ? 'border-emerald-400/70 bg-emerald-500/10' : 'border-rose-400/70 bg-rose-500/10',
    fillClass: 'bg-transparent',
  };
};

const formatMetric = (round, side, scoreMode) => {
  if (!round.winner) return '';

  const isLocalSide = side === 'left';
  const isWinningSide = isLocalSide ? round.winner === 'local' : round.winner === 'opponent';
  const result = isLocalSide ? round.localResult : round.opponentResult;

  if (!result) return '';

  if (scoreMode === 'time') {
    if (!isWinningSide) return '';
    return `${(result.timeMs / 1000).toFixed(1)}s`;
  }

  return `${result.guessCount} guess${result.guessCount === 1 ? '' : 'es'}`;
};

function RoundSquare({ round, index, side, scoreMode }) {
  const squareState = getSquareState(round, side);
  const showFace = Boolean(round.winner);
  const faceSrc = showFace && round.target?.name
    ? `https://mc-heads.net/avatar/${encodeURIComponent(round.target.name)}`
    : null;
  const metricLabel = formatMetric(round, side, scoreMode);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ring-1 ring-white/20 text-xs font-semibold text-white ${squareState.borderClass} ${squareState.fillClass}`}
        aria-label={`Round ${index + 1}`}
      >
        {faceSrc ? (
          <img src={faceSrc} alt="" className="h-full w-full rounded-[inherit] object-cover opacity-95" />
        ) : null}
      </div>
      {metricLabel ? (
        <span className="text-[10px] font-semibold tracking-wide text-white/60">{metricLabel}</span>
      ) : (
        <span className="h-2.5" aria-hidden="true" />
      )}
    </div>
  );
}

export default function VsRoundSummary({
  side,
  nickname,
  score,
  rounds,
  scoreMode,
}) {
  const isLeft = side === 'left';
  const displayRounds = isLeft ? [...rounds].reverse() : rounds;

  return (
    <div className={`flex flex-1 flex-col gap-3 ${isLeft ? 'items-end text-right' : 'items-start text-left'}`}>
      <div className={`flex w-full items-center gap-2 ${isLeft ? 'justify-end' : 'justify-start'}`}>
        {isLeft ? (
          <>
            <span className="truncate text-sm font-semibold text-white/80">{nickname || 'You'}</span>
            <span className=" border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-sm font-bold text-emerald-200 shadow-sm shadow-emerald-500/10">
              {score}
            </span>
          </>
        ) : (
          <>
            <span className=" border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-sm font-bold text-rose-200 shadow-sm shadow-rose-500/10">
              {score}
            </span>
            <span className="truncate text-sm font-semibold text-white/80">{nickname || 'Opponent'}</span>
          </>
        )}
      </div>

      <div className={`flex w-full items-center gap-2 ${isLeft ? 'justify-end' : 'justify-start'}`}>
        {displayRounds.map((round, index) => (
          <RoundSquare key={`${side}-${round.roundIndex}`} round={round} index={index} side={side} scoreMode={scoreMode} />
        ))}
      </div>
    </div>
  );
}
