/**
 * Backend puzzle logic tests
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { getDateKey, selectPuzzle, buildPublicPayload } from '../../backend/src/puzzle.js';

describe('getDateKey', () => {
  it('returns a YYYY-MM-DD string', () => {
    const key = getDateKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a valid date', () => {
    const key = getDateKey();
    const d = new Date(key);
    expect(isNaN(d.getTime())).toBe(false);
  });
});

describe('selectPuzzle', () => {
  it('returns a puzzle object', () => {
    const puzzle = selectPuzzle('2024-01-15');
    expect(puzzle).toBeDefined();
    expect(typeof puzzle.title).toBe('string');
    expect(Array.isArray(puzzle.heatmap.seasons)).toBe(true);
  });

  it('is deterministic — same date always returns same puzzle', () => {
    const a = selectPuzzle('2024-01-15');
    const b = selectPuzzle('2024-01-15');
    expect(a.id).toBe(b.id);
  });

  it('returns a valid puzzle for multiple dates', () => {
    const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
    const ids = dates.map(selectPuzzle).map((p) => p.id);
    expect(ids.every((id) => typeof id === 'string')).toBe(true);
  });

  it('never returns undefined for any reasonable date', () => {
    const testDates = [
      '2024-01-01', '2024-06-15', '2024-12-31',
      '2025-03-20', '2030-07-04',
    ];
    for (const d of testDates) {
      const p = selectPuzzle(d);
      expect(p).toBeDefined();
      expect(p.title).toBeTruthy();
    }
  });
});

describe('buildPublicPayload', () => {
  let puzzle;

  beforeEach(() => {
    puzzle = selectPuzzle('2024-01-15');
  });

  it('never leaks title in 0-attempt payload', () => {
    const p = buildPublicPayload(puzzle, 0);
    expect(p.answer).toBeUndefined();
    expect(p.title).toBeUndefined();
    expect(p.clues.tier1).toBeUndefined();
    expect(p.clues.tier2).toBeUndefined();
    expect(p.clues.tier3).toBeUndefined();
    expect(p.clues.tier4).toBeUndefined();
  });

  it('reveals tier1 after 1 wrong guess', () => {
    const p = buildPublicPayload(puzzle, 1);
    expect(p.clues.tier1).toBeDefined();
    expect(p.clues.tier1.premiereYear).toBeDefined();
    expect(p.clues.tier1.runtimeBucket).toBeDefined();
    expect(p.clues.tier2).toBeUndefined();
  });

  it('reveals tier2 after 2 wrong guesses', () => {
    const p = buildPublicPayload(puzzle, 2);
    expect(p.clues.tier2).toBeDefined();
    expect(p.clues.tier2.network).toBeDefined();
    expect(p.clues.tier3).toBeUndefined();
  });

  it('reveals tier3 after 3 wrong guesses', () => {
    const p = buildPublicPayload(puzzle, 3);
    expect(p.clues.tier3).toBeDefined();
    expect(p.clues.tier3.genre).toBeDefined();
    expect(p.clues.tier3.status).toBeDefined();
    expect(p.clues.tier4).toBeUndefined();
  });

  it('reveals tier4 after 4 wrong guesses', () => {
    const p = buildPublicPayload(puzzle, 4);
    expect(p.clues.tier4).toBeDefined();
    expect(p.clues.tier4.topEpisodeTitle).toBeDefined();
    expect(p.clues.tier4.topEpisodeLead).toBeDefined();
  });

  it('always includes heatmap', () => {
    for (let i = 0; i <= 4; i++) {
      const p = buildPublicPayload(puzzle, i);
      expect(p.heatmap).toBeDefined();
      expect(Array.isArray(p.heatmap.seasons)).toBe(true);
    }
  });
});
