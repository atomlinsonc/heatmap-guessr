import { useState, useEffect, useCallback, useRef } from 'react';
import { loadDayState, saveDayState, updateStreak } from '../utils/storage.js';
import { buildShareText, copyToClipboard } from '../utils/share.js';

const API = import.meta.env.VITE_API_URL ?? '';

async function apiFetch(path, opts) {
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * useGame — manages all game state.
 *
 * Persistence: guesses + attempt count are saved to localStorage keyed by dateKey.
 * On mount, if a saved state exists for today it is restored (so refresh doesn't reset).
 */
export function useGame() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const [dateKey, setDateKey] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [titles, setTitles] = useState([]);

  const [guesses, setGuesses] = useState([]);          // [{ title, correct }]
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [won, setWon] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [shareText, setShareText] = useState('');

  const initialized = useRef(false);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        // Fetch titles and puzzle in parallel
        const [titlesData, puzzleData] = await Promise.all([
          apiFetch('/api/puzzle/titles'),
          apiFetch('/api/puzzle/today?attempts=0'),
        ]);

        if (cancelled) return;

        const dk = puzzleData.dateKey;
        setDateKey(dk);
        setTitles(titlesData.titles ?? []);

        // Restore saved state for today if it exists
        const saved = loadDayState(dk);
        if (saved && saved.dateKey === dk) {
          setGuesses(saved.guesses);
          setAttemptsUsed(saved.attemptsUsed);
          setWon(saved.won);
          setIsOver(saved.isOver);
          if (saved.answer) setAnswer(saved.answer);

          // Re-fetch puzzle with the saved attempt count to get correct clues
          const refreshed = await apiFetch(`/api/puzzle/today?attempts=${saved.attemptsUsed}`);
          if (cancelled) return;
          setPuzzle(refreshed.puzzle);
          if (refreshed.puzzle.answer) setAnswer(refreshed.puzzle.answer);
        } else {
          setPuzzle(puzzleData.puzzle);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [retryCount]);

  const retry = useCallback(() => setRetryCount((n) => n + 1), []);

  // ── Submit a guess ─────────────────────────────────────────────────────────
  const submitGuess = useCallback(async (guessTitle) => {
    if (isOver || submitting) return;

    // Deduplicate
    if (guesses.some((g) => g.title.toLowerCase() === guessTitle.toLowerCase())) return;

    setSubmitting(true);
    try {
      const data = await apiFetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: guessTitle, attemptsUsed }),
      });

      const newGuesses = [...guesses, { title: guessTitle, correct: data.correct }];
      const newAttempts = data.attemptsUsed;
      const nowWon = data.correct;
      const nowOver = nowWon || newAttempts >= 5;
      const ans = data.answer ?? null;

      setGuesses(newGuesses);
      setAttemptsUsed(newAttempts);
      setPuzzle(data.puzzle);
      setWon(nowWon);
      setIsOver(nowOver);
      if (ans) setAnswer(ans);

      // Persist to localStorage
      const state = {
        dateKey,
        guesses: newGuesses,
        attemptsUsed: newAttempts,
        won: nowWon,
        isOver: nowOver,
        answer: ans,
      };
      saveDayState(dateKey, state);

      // Update streak on game over
      if (nowOver) {
        updateStreak(dateKey, nowWon);
        if (ans) {
          const text = buildShareText(dateKey, newGuesses, nowWon);
          setShareText(text);
        }
      }
    } catch (err) {
      console.error('Guess failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [isOver, submitting, guesses, attemptsUsed, dateKey]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const share = useCallback(async () => {
    const text = shareText || buildShareText(dateKey, guesses, won);
    setShareText(text);
    await copyToClipboard(text);
  }, [shareText, dateKey, guesses, won]);

  return {
    loading,
    error,
    retry,
    dateKey,
    puzzle,
    titles,
    guesses,
    attemptsUsed,
    won,
    isOver,
    answer,
    submitting,
    shareText,
    submitGuess,
    share,
  };
}
