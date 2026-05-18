import { useEffect, useMemo, useState } from 'react';
import { compareStats, findPlayerByNameOrAlias } from '../utils/gameLogic';

const VISIBILITY_MAP = {
  Player: 'name',
  Debut: 'debut',
  'Canon Finales': 'canonFinale',
  'Non-Canon Finales': 'nonCanonFinale',
  'Canon Played': 'canonPlayed',
  'Non-Canon Played': 'nonCanonPlayed',
  'Favorite Game': 'favGame',
  'Least Favorite Game': 'leastFavGame',
  'Best Game': 'bestGame',
  'Best Game (Retired)': 'bestGameRetired',
  Region: 'region',
  'Canon Wins': 'canonWins',
  'Non-Canon Wins': 'nonCanonWins',
};

const COLUMN_ORDER = [
  'Player',
  'Debut',
  'Canon Finales',
  'Non-Canon Finales',
  'Canon Played',
  'Non-Canon Played',
  'Favorite Game',
  'Least Favorite Game',
  'Best Game',
  'Best Game (Retired)',
  'Region',
  'Canon Wins',
  'Non-Canon Wins',
];

const COLUMN_WIDTHS = {
  Player: 'w-16 sm:w-20',
  Debut: 'w-14 sm:w-16',
  'Canon Finales': 'w-8 sm:w-9',
  'Non-Canon Finales': 'w-8 sm:w-9',
  'Canon Played': 'w-8 sm:w-9',
  'Non-Canon Played': 'w-8 sm:w-9',
  'Favorite Game': 'w-14 sm:w-16',
  'Least Favorite Game': 'w-14 sm:w-16',
  'Best Game': 'w-14 sm:w-16',
  'Best Game (Retired)': 'w-14 sm:w-16',
  Region: 'w-8 sm:w-9',
  'Canon Wins': 'w-8 sm:w-9',
  'Non-Canon Wins': 'w-8 sm:w-9',
};

const getTileClass = (stat) => {
  if (stat === 'correct') return 'bg-green-700';
  if (stat === 'close') return 'bg-orange-400';
  if (stat === 'close-higher') return 'bg-orange-400';
  if (stat === 'close-lower') return 'bg-orange-400';
  if (stat === 'later') return 'bg-gray-500';
  if (stat === 'earlier') return 'bg-gray-500';
  return 'bg-gray-500';
};

const formatTime = (ms) => {
  const totalSeconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
};

function SmoothTimer({ startedAt, scoreMode, timeLimitSeconds }) {
  const [now, setNow] = useState(() => Date.now());
  const isCountdown = scoreMode === 'guesses';

  useEffect(() => {
    let frameId = 0;

    const loop = () => {
      setNow(Date.now());
      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const renderLabel = useMemo(() => {
    if (!startedAt) return isCountdown ? '00:00' : '00:00.0';

    if (isCountdown) {
      const elapsedMs = now - startedAt;
      const totalMs = (timeLimitSeconds || 0) * 1000;
      const remainingMs = Math.max(0, totalMs - elapsedMs);
      const totalSeconds = Math.round(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return formatTime(now - startedAt);
  }, [now, startedAt, isCountdown, timeLimitSeconds]);

  const borderClass = isCountdown && startedAt && (now - startedAt) >= ((timeLimitSeconds || 0) * 1000)
    ? 'border-orange-400/60 bg-orange-500/5'
    : 'border-white/10 bg-black/35';

  return (
    <div className={`flex min-w-[140px] flex-col items-center justify-center rounded-2xl border px-4 py-3 text-center shadow-inner shadow-black/20 ${borderClass}`}>
      <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Timer</div>
      <div className="mt-1 font-mono text-lg font-semibold text-white tabular-nums tracking-wide">{renderLabel}</div>
    </div>
  );
}

function OpponentCooldownBadge({ opponentLastGuessAt, cooldownSeconds }) {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const totalCooldownMs = Math.max(0, Number(cooldownSeconds || 0) * 1000);
    if (totalCooldownMs <= 0 || !opponentLastGuessAt) {
      setRemainingMs(0);
      return;
    }

    let frameId = 0;
    const tick = () => {
      const nextRemaining = Math.max(0, totalCooldownMs - (Date.now() - opponentLastGuessAt));
      setRemainingMs(nextRemaining);
      if (nextRemaining > 0) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [cooldownSeconds, opponentLastGuessAt]);

  if (remainingMs <= 0) return null;

  return (
    <div className="rounded-full border border-orange-400/70 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-orange-300">
      CD {(remainingMs / 1000).toFixed(1)}s
    </div>
  );
}

function MiniGuessRow({ guess, target, visibleStats }) {
  const feedback = compareStats(guess, target);

  return (
    <div className="flex gap-1">
      {COLUMN_ORDER.map((label) => {
        const key = VISIBILITY_MAP[label];
        if (visibleStats && !visibleStats.includes(key)) return null;

        return (
          <div
            key={label}
            className={`h-3.5 rounded-sm border border-white/10 ${COLUMN_WIDTHS[label]} ${getTileClass(feedback[key])}`}
            aria-label={`${guess.name} ${label}`}
            title={`${guess.name} ${label}`}
          />
        );
      })}
    </div>
  );
}

function MiniGuessTable({ title, guesses, target, visibleStats }) {
  const rows = useMemo(() => guesses
    .map((entry) => (typeof entry === 'string' ? findPlayerByNameOrAlias(entry) : entry))
    .filter(Boolean), [guesses]);

  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-3 shadow-inner shadow-black/10">
      {/* <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/45">{title}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/60">{rows.length}</span>
      </div> */}

      <div className="flex min-h-[2.25rem] flex-col gap-1">
        {rows.length > 0 ? (
          rows.map((guess) => (
            <MiniGuessRow key={guess.name} guess={guess} target={target} visibleStats={visibleStats} />
          ))
        ) : (
          <div className="h-10 w-full rounded-xl border border-dashed border-white/10 bg-white/0" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export function VsOpponentMiniBoard({
  opponentGuesses,
  target,
  visibleStats,
  opponentLastGuessAt,
  cooldownSeconds,
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-black/35 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.28em] text-white/45">Opponent mini board</div>
        <OpponentCooldownBadge opponentLastGuessAt={opponentLastGuessAt} cooldownSeconds={cooldownSeconds} />
      </div>
      <div className="max-h-[44vh] overflow-y-auto pr-1">
        <MiniGuessTable
          title="Opponent guesses made"
          guesses={opponentGuesses}
          target={target}
          visibleStats={visibleStats}
        />
      </div>
    </div>
  );
}

export default function VsRoundDetailsBar({
  localGuesses,
  opponentGuesses,
  startedAt,
  scoreMode,
  timeLimitSeconds,
  isSurrendered,
  onSurrenderRound,
}) {
  return (
    <div className="grid items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div className="flex items-center justify-center gap-2 lg:justify-end">
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/45">Your guesses made</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white/80">{localGuesses.length}</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <SmoothTimer startedAt={startedAt} scoreMode={scoreMode} timeLimitSeconds={timeLimitSeconds} />
        <button
          type="button"
          onClick={onSurrenderRound}
          disabled={isSurrendered}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] transition ${
            isSurrendered
              ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
              : 'cursor-pointer border-rose-400/55 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
          }`}
        >
          {isSurrendered ? 'Surrendered' : 'Surrender Round'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 lg:justify-start">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white/80">{opponentGuesses.length}</span>
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/45">Opponent guesses made</span>
      </div>
    </div>
  );
}
