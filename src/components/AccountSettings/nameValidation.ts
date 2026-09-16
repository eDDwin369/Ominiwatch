// Full name: 2-60 chars after trimming, must start with a letter, and may only
// contain letters (any script), spaces, hyphens, apostrophes and periods.
// Rejects empty, digits, symbol garbage and leading/trailing punctuation.
const NAME_FORMAT_RE = /^\p{L}[\p{L}\s.'-]*\p{L}$/u;

export function isValidName(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 60) return false;
  return NAME_FORMAT_RE.test(trimmed);
}
