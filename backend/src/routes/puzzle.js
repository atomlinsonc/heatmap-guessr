import { Router } from 'express';
import { getTodaysPuzzle, buildPublicPayload, getDateKey } from '../puzzle.js';
import { loadTitles } from '../titles.js';

export const puzzleRouter = Router();

// GET /api/puzzle/today?attempts=N
// Returns safe puzzle payload (no title leak) based on attempts already used.
puzzleRouter.get('/today', (req, res) => {
  try {
    const attemptsUsed = Math.min(5, Math.max(0, parseInt(req.query.attempts ?? '0', 10) || 0));
    const puzzle = getTodaysPuzzle();
    const dateKey = getDateKey();
    const payload = buildPublicPayload(puzzle, attemptsUsed);

    // If game is over (all 5 wrong), reveal title
    if (attemptsUsed >= 5) {
      payload.answer = puzzle.title;
    }

    res.json({ dateKey, puzzle: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load puzzle' });
  }
});

// GET /api/puzzle/titles
// Returns frozen autocomplete list (titles only, no metadata).
puzzleRouter.get('/titles', (_req, res) => {
  try {
    const titles = loadTitles();
    res.json({ titles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load titles' });
  }
});
