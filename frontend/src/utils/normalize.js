/**
 * Client-side title normalizer — mirrors backend/src/normalize.js exactly.
 * Used for duplicate-guess detection in the autocomplete.
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
