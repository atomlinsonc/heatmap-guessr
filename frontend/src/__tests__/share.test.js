import { describe, it, expect } from 'vitest';
import { buildShareText } from '../utils/share.js';

describe('buildShareText', () => {
  const guesses = [
    { title: 'The Wire', correct: false },
    { title: 'Breaking Bad', correct: true },
  ];

  it('includes the date key', () => {
    const text = buildShareText('2024-01-15', guesses, true);
    expect(text).toContain('2024-01-15');
  });

  it('shows correct score when won', () => {
    const text = buildShareText('2024-01-15', guesses, true);
    expect(text).toContain('2/5');
  });

  it('shows X/5 when lost', () => {
    const lossGuesses = [
      { title: 'A', correct: false },
      { title: 'B', correct: false },
      { title: 'C', correct: false },
      { title: 'D', correct: false },
      { title: 'E', correct: false },
    ];
    const text = buildShareText('2024-01-15', lossGuesses, false);
    expect(text).toContain('X/5');
  });

  it('uses green square for correct and red for wrong', () => {
    const text = buildShareText('2024-01-15', guesses, true);
    expect(text).toContain('🟥');
    expect(text).toContain('🟩');
  });

  it('includes game title', () => {
    const text = buildShareText('2024-01-15', guesses, true);
    expect(text).toContain('Heatmap Guessr');
  });

  it('pads with grey squares when game is lost', () => {
    const lossGuesses = [{ title: 'A', correct: false }];
    const text = buildShareText('2024-01-15', lossGuesses, false);
    expect(text).toContain('⬜');
  });
});
