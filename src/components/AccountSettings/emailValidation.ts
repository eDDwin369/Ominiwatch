// Email: required. One "@", non-empty local part, a dotted domain with a 2+
// letter TLD, no spaces. Deliberately pragmatic, not full RFC 5322.
const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return EMAIL_FORMAT_RE.test(trimmed);
}
