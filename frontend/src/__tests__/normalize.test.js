import { describe, it, expect } from 'vitest';
import { normalizeTitle } from '../utils/normalize.js';

describe('normalizeTitle (frontend)', () => {
  it('mirrors backend behavior', () => {
    expect(normalizeTitle('The Wire')).toBe('wire');
    expect(normalizeTitle('Breaking Bad')).toBe('breaking bad');
    expect(normalizeTitle('House M.D.')).toBe('house md');
    expect(normalizeTitle('Mr. Robot')).toBe('mr robot');
    expect(normalizeTitle('')).toBe('');
  });

  it('strips leading articles', () => {
    expect(normalizeTitle('The Office')).toBe('office');
    expect(normalizeTitle('A Series of Events')).toBe('series of events');
    expect(normalizeTitle('An American Crime')).toBe('american crime');
  });

  it('collapses whitespace', () => {
    expect(normalizeTitle('  Breaking   Bad  ')).toBe('breaking bad');
  });

  it('removes punctuation', () => {
    expect(normalizeTitle("It's Always Sunny")).toBe('its always sunny');
  });
});
