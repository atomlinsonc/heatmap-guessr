import { Router } from 'express';
import { getTodaysPuzzle, buildPublicPayload, getDateKey, selectPuzzle } from '../puzzle.js';
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

// GET /api/puzzle/date/:dateKey?attempts=N
// Load a specific past (or today's) puzzle by date. Past puzzles are always fully revealed.
puzzleRouter.get('/date/:dateKey', (req, res) => {
  try {
    const { dateKey } = req.params;
    // Validate format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const todayKey = getDateKey();
    const isPast = dateKey < todayKey;
    const attemptsUsed = isPast
      ? 5  // Past puzzles: reveal all clues immediately (it's a replay)
      : Math.min(5, Math.max(0, parseInt(req.query.attempts ?? '0', 10) || 0));

    const puzzle = selectPuzzle(dateKey);
    const payload = buildPublicPayload(puzzle, attemptsUsed);

    // Past puzzles: always reveal the answer
    if (isPast || attemptsUsed >= 5) {
      payload.answer = puzzle.title;
    }

    res.json({ dateKey, puzzle: payload, isPast });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load puzzle' });
  }
});

// GET /api/puzzle/archive?days=N
// Returns list of past daily puzzles (last N days, default 30, max 365).
// For each day: dateKey + show title (already played = answer is no longer secret).
puzzleRouter.get('/archive', (_req, res) => {
  try {
    const todayKey = getDateKey();
    const days = 365; // Return all of 2026 worth

    const archive = [];
    const today = new Date(todayKey + 'T12:00:00Z');

    for (let i = 1; i <= days; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const dk = d.toISOString().slice(0, 10);
      // Only include dates from Jan 1, 2026 onward (game launch)
      if (dk < '2026-02-24') break;
      const puzzle = selectPuzzle(dk);
      archive.push({ dateKey: dk, title: puzzle.title, id: puzzle.id });
    }

    res.json({ archive });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load archive' });
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
