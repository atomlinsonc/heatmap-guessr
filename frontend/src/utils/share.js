/**
 * Builds the shareable result string (Wordle-style).
 *
 * Example output:
 *   Heatmap Guessr: TV Edition
 *   2024-01-15  3/5
 *
 *   🟥🟥🟩
 */
export function buildShareText(dateKey, guesses, won) {
  const MAX = 5;
  const score = won ? `${guesses.length}/5` : 'X/5';

  const squares = guesses
    .map((g) => (g.correct ? '🟩' : '🟥'))
    .join('');

  // Pad remaining attempts as grey if game was lost
  const remaining = won ? '' : '⬜'.repeat(MAX - guesses.length);

  return [
    'Heatmap Guessr: TV Edition',
    `${dateKey}  ${score}`,
    '',
    squares + remaining,
    '',
    'https://heatmapguessr.com',
  ].join('\n');
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}
