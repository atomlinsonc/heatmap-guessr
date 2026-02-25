import { Router } from 'express';
import { getTodaysPuzzle, buildPublicPayload, getDateKey, selectPuzzle } from '../puzzle.js';
import { normalizeTitle } from '../normalize.js';

export const guessRouter = Router();

/**
 * POST /api/guess
 * Body: { guess: string, attemptsUsed: number, dateKey?: string }
 * Returns: { correct, attemptsUsed, puzzle, answer? }
 * If dateKey is provided (past game replay), uses that puzzle.
 */
guessRouter.post('/', (req, res) => {
  try {
    const { guess, attemptsUsed: prevAttempts, dateKey: requestedDateKey } = req.body;

    if (typeof guess !== 'string' || guess.trim() === '') {
      return res.status(400).json({ error: 'guess is required' });
    }
    if (typeof prevAttempts !== 'number' || prevAttempts < 0 || prevAttempts > 4) {
      return res.status(400).json({ error: 'attemptsUsed must be 0–4' });
    }

    const todayKey = getDateKey();
    const dateKey = requestedDateKey && /^\d{4}-\d{2}-\d{2}$/.test(requestedDateKey)
      ? requestedDateKey
      : todayKey;
    const puzzle = dateKey === todayKey ? getTodaysPuzzle() : selectPuzzle(dateKey);
    const normalizedGuess = normalizeTitle(guess);

    // Build match targets: title + all aliases
    const targets = [puzzle.title, ...(puzzle.aliases || [])].map(normalizeTitle);
    const correct = targets.includes(normalizedGuess);

    const newAttempts = prevAttempts + 1;
    const gameOver = !correct && newAttempts >= 5;
    const payload = buildPublicPayload(puzzle, newAttempts);

    const response = {
      correct,
      attemptsUsed: newAttempts,
      dateKey: dateKey,
      puzzle: payload,
    };

    if (correct || gameOver) {
      response.answer = puzzle.title;
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
