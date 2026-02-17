/**
 * Normalize a title for comparison:
 * - Lowercase
 * - Strip leading "the ", "a ", "an "
 * - Remove all punctuation and extra whitespace
 */
export function normalizeTitle(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/^(the|a|an)\s+/, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
