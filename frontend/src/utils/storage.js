/**
 * Local-storage helpers for persisting daily game state and streak.
 *
 * State shape stored under key "hg_state_<dateKey>":
 * {
 *   dateKey: string,
 *   guesses: Array<{ title: string, correct: boolean }>,
 *   attemptsUsed: number,
 *   won: boolean,
 *   isOver: boolean,
 * }
 *
 * Streak shape stored under key "hg_streak":
 * {
 *   current: number,
 *   best: number,
 *   lastWonDate: string | null,
 * }
 */

const STATE_PREFIX = 'hg_state_';
const STREAK_KEY = 'hg_streak';

export function loadDayState(dateKey) {
  try {
    const raw = localStorage.getItem(STATE_PREFIX + dateKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDayState(dateKey, state) {
  try {
    localStorage.setItem(STATE_PREFIX + dateKey, JSON.stringify(state));
  } catch {
    // storage quota exceeded — ignore
  }
}

export function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, best: 0, lastWonDate: null };
    return JSON.parse(raw);
  } catch {
    return { current: 0, best: 0, lastWonDate: null };
  }
}

export function updateStreak(dateKey, won) {
  const streak = loadStreak();

  if (won) {
    // Check if yesterday was the last win (consecutive)
    const yesterday = getPrevDateKey(dateKey);
    const isConsecutive = streak.lastWonDate === yesterday;
    streak.current = isConsecutive ? streak.current + 1 : 1;
    streak.best = Math.max(streak.best, streak.current);
    streak.lastWonDate = dateKey;
  } else {
    // Lost today — don't break streak yet, but stop incrementing
    // Streak breaks only if they miss a day entirely
  }

  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch {
    // ignore
  }

  return streak;
}

/** Returns YYYY-MM-DD for the calendar day before dateKey. */
function getPrevDateKey(dateKey) {
  const d = new Date(dateKey + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
