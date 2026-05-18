import { DEFAULT_VISIBLE_STATS, STAT_DEFINITIONS } from './vsModeConstants';

export default function StatSelector({ value, onChange, disabled }) {
  const selected = Array.isArray(value) ? value : DEFAULT_VISIBLE_STATS;

  const toggle = (key) => {
    if (disabled) return;
    const next = selected.includes(key)
      ? selected.filter((entry) => entry !== key)
      : [...selected, key];
    onChange(next.length > 0 ? next : selected);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
      <div className="mb-3 text-sm font-semibold text-white/85">Visible stats</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {STAT_DEFINITIONS.map((stat) => {
          const isSelected = selected.includes(stat.key);
          const itemClass = disabled
            ? isSelected
              ? ''
              : 'opacity-40'
            : '';

          return (
            <label
              key={stat.key}
              className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm ${itemClass}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(stat.key)}
                disabled={disabled}
              />
              <span>{stat.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
