import { describe, it, expect } from 'vitest';
import { normalizeTitle } from '../../frontend/src/utils/normalize.js';

describe('normalizeTitle (frontend)', () => {
  it('mirrors backend behavior', () => {
    expect(normalizeTitle('The Wire')).toBe('wire');
    expect(normalizeTitle('Breaking Bad')).toBe('breaking bad');
    expect(normalizeTitle('House M.D.')).toBe('house md');
    expect(normalizeTitle('Mr. Robot')).toBe('mr robot');
    expect(normalizeTitle('')).toBe('');
  });
});
