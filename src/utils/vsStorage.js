import { DEFAULT_VISIBLE_STATS } from '../components/vsModeConstants';

const STORAGE_KEY = 'wic-vs-settings';
const NICKNAME_KEY = 'wic-vs-nickname';

const clampInt = (value, min, max, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

export const normalizeVsSettings = (settings) => {
  const input = settings && typeof settings === 'object' ? settings : {};
  return {
    matchMode: input.matchMode === 'continuous' ? 'continuous' : 'round',
    scoreMode: input.scoreMode === 'guesses' ? 'guesses' : 'time',
    rounds: clampInt(input.rounds, 1, 9, 3),
    cooldownSeconds: clampInt(input.cooldownSeconds, 0, 15, 0),
    timeLimitSeconds: clampInt(input.timeLimitSeconds, 15, 600, 120),
    visibleStats: Array.isArray(input.visibleStats) && input.visibleStats.length > 0
      ? input.visibleStats.filter((key) => DEFAULT_VISIBLE_STATS.includes(key))
      : DEFAULT_VISIBLE_STATS,
  };
};

export const loadVsSettings = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeVsSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeVsSettings({});
  }
};

export const saveVsSettings = (settings) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
};

export const loadVsNickname = () => {
  try {
    return window.localStorage.getItem(NICKNAME_KEY) || '';
  } catch {
    return '';
  }
};

export const saveVsNickname = (nickname) => {
  try {
    window.localStorage.setItem(NICKNAME_KEY, nickname || '');
  } catch {
    // ignore storage errors
  }
};
