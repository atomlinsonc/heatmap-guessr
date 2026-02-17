import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../backend/src/index.js';

describe('POST /api/guess', () => {
  it('returns 400 for missing guess', async () => {
    const res = await request(app)
      .post('/api/guess')
      .send({ attemptsUsed: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for invalid attemptsUsed', async () => {
    const res = await request(app)
      .post('/api/guess')
      .send({ guess: 'Breaking Bad', attemptsUsed: 10 });
    expect(res.status).toBe(400);
  });

  it('returns correct=false for a wrong guess', async () => {
    const res = await request(app)
      .post('/api/guess')
      .send({ guess: 'This Show Does Not Exist XYZ', attemptsUsed: 0 });
    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(false);
    expect(res.body.attemptsUsed).toBe(1);
    expect(res.body.puzzle).toBeDefined();
    expect(res.body.puzzle.heatmap).toBeDefined();
  });

  it('does not leak answer on first wrong guess', async () => {
    const res = await request(app)
      .post('/api/guess')
      .send({ guess: 'Wrong Show A', attemptsUsed: 0 });
    expect(res.body.answer).toBeUndefined();
  });

  it('increments attemptsUsed correctly', async () => {
    const r1 = await request(app)
      .post('/api/guess')
      .send({ guess: 'Wrong Show A', attemptsUsed: 0 });
    expect(r1.body.attemptsUsed).toBe(1);

    const r2 = await request(app)
      .post('/api/guess')
      .send({ guess: 'Wrong Show B', attemptsUsed: 1 });
    expect(r2.body.attemptsUsed).toBe(2);
  });

  it('reveals answer when 5th guess is wrong', async () => {
    const res = await request(app)
      .post('/api/guess')
      .send({ guess: 'Fake Show That Will Never Match', attemptsUsed: 4 });
    expect(res.status).toBe(200);
    expect(res.body.attemptsUsed).toBe(5);
    expect(res.body.answer).toBeDefined();
    expect(typeof res.body.answer).toBe('string');
  });

  it('reveals all 4 clue tiers on 5th attempt', async () => {
    const res = await request(app)
      .post('/api/guess')
      .send({ guess: 'Fake Show', attemptsUsed: 4 });
    const { clues } = res.body.puzzle;
    expect(clues.tier1).toBeDefined();
    expect(clues.tier2).toBeDefined();
    expect(clues.tier3).toBeDefined();
    expect(clues.tier4).toBeDefined();
  });
});

describe('GET /api/puzzle/today', () => {
  it('returns a puzzle with heatmap', async () => {
    const res = await request(app).get('/api/puzzle/today');
    expect(res.status).toBe(200);
    expect(res.body.puzzle).toBeDefined();
    expect(res.body.puzzle.heatmap).toBeDefined();
    expect(res.body.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('does not leak title at 0 attempts', async () => {
    const res = await request(app).get('/api/puzzle/today?attempts=0');
    expect(res.body.puzzle.title).toBeUndefined();
    expect(res.body.puzzle.answer).toBeUndefined();
  });

  it('returns tier1 clues at attempts=1', async () => {
    const res = await request(app).get('/api/puzzle/today?attempts=1');
    expect(res.body.puzzle.clues.tier1).toBeDefined();
    expect(res.body.puzzle.clues.tier2).toBeUndefined();
  });
});

describe('GET /api/puzzle/titles', () => {
  it('returns an array of title objects', async () => {
    const res = await request(app).get('/api/puzzle/titles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.titles)).toBe(true);
    expect(res.body.titles.length).toBeGreaterThan(0);
    expect(res.body.titles[0].title).toBeDefined();
  });
});

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
