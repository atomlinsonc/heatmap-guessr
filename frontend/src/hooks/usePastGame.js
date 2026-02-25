import { useState, useEffect, useCallback } from 'react';
import { loadDayState, saveDayState } from '../utils/storage.js';
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
 * usePastGame — loads and manages state for replaying a past daily puzzle.
 * Past puzzles start fully revealed (all clues shown, answer available).
 * Players can still guess interactively for fun.
 */
export function usePastGame(dateKey) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [answer, setAnswer] = useState(null);

  const [guesses, setGuesses] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [won, setWon] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shareText, setShareText] = useState('');

  // Load the past puzzle
  useEffect(() => {
    if (!dateKey) return;
    setLoading(true);
    setError(null);

    // Try to restore saved state for this past game
    const saved = loadDayState(`past_${dateKey}`);

    apiFetch(`/api/puzzle/date/${dateKey}`)
      .then(data => {
        setPuzzle(data.puzzle);
        if (data.puzzle.answer) setAnswer(data.puzzle.answer);

        // Restore saved guesses if they exist
        if (saved) {
          setGuesses(saved.guesses ?? []);
          setAttemptsUsed(saved.attemptsUsed ?? 0);
          setWon(saved.won ?? false);
          setIsOver(saved.isOver ?? false);
          if (saved.answer) setAnswer(saved.answer);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [dateKey]);

  const submitGuess = useCallback(async (guessTitle) => {
    if (isOver || submitting || !dateKey) return;
    if (guesses.some(g => g.title.toLowerCase() === guessTitle.toLowerCase())) return;

    setSubmitting(true);
    try {
      const data = await apiFetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: guessTitle, attemptsUsed, dateKey }),
      });

      const newGuesses = [...guesses, { title: guessTitle, correct: data.correct }];
      const newAttempts = data.attemptsUsed;
      const nowWon = data.correct;
      const nowOver = nowWon || newAttempts >= 5;
      const ans = data.answer ?? answer;

      setGuesses(newGuesses);
      setAttemptsUsed(newAttempts);
      setPuzzle(data.puzzle);
      setWon(nowWon);
      setIsOver(nowOver);
      if (ans) setAnswer(ans);

      const state = { guesses: newGuesses, attemptsUsed: newAttempts, won: nowWon, isOver: nowOver, answer: ans };
      saveDayState(`past_${dateKey}`, state);

      if (nowOver && ans) {
        setShareText(buildShareText(`Past ${dateKey}`, newGuesses, nowWon));
      }
    } catch (err) {
      console.error('Past game guess failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [isOver, submitting, guesses, attemptsUsed, dateKey, answer]);

  const share = useCallback(async () => {
    const text = shareText || buildShareText(`Past ${dateKey}`, guesses, won);
    setShareText(text);
    await copyToClipboard(text);
  }, [shareText, dateKey, guesses, won]);

  return {
    loading, error, puzzle, answer, dateKey,
    guesses, attemptsUsed, won, isOver, submitting, shareText,
    submitGuess, share,
  };
}
