import { describe, it, expect } from '@jest/globals';
import { normalizeTitle } from '../../backend/src/normalize.js';

describe('normalizeTitle', () => {
  it('lowercases input', () => {
    expect(normalizeTitle('Breaking Bad')).toBe('breaking bad');
  });

  it('strips leading "the"', () => {
    expect(normalizeTitle('The Wire')).toBe('wire');
    expect(normalizeTitle('THE WIRE')).toBe('wire');
  });

  it('strips leading "a"', () => {
    expect(normalizeTitle('A Series of Events')).toBe('series of events');
  });

  it('strips leading "an"', () => {
    expect(normalizeTitle('An American Crime')).toBe('american crime');
  });

  it('removes punctuation', () => {
    expect(normalizeTitle('House M.D.')).toBe('house md');
    expect(normalizeTitle("It's Always Sunny")).toBe('its always sunny');
    expect(normalizeTitle('Mr. Robot')).toBe('mr robot');
  });

  it('collapses extra whitespace', () => {
    expect(normalizeTitle('  Breaking   Bad  ')).toBe('breaking bad');
  });

  it('handles empty string', () => {
    expect(normalizeTitle('')).toBe('');
  });

  it('produces same output for title and alias', () => {
    const title = normalizeTitle('Breaking Bad');
    const alias = normalizeTitle('breaking bad');
    expect(title).toBe(alias);
  });

  it('differentiates "The Office" from "The Office US"', () => {
    expect(normalizeTitle('The Office')).toBe('office');
    expect(normalizeTitle('The Office US')).toBe('office us');
  });
});
