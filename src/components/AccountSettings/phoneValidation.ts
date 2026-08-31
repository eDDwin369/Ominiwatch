// Accepts an optional leading '+' followed by digits/spaces/hyphens/parens/dots.
// Empty is valid (phone is optional) — anything non-empty must be a plausible
// international number: correct characters and 7-15 actual digits.
const PHONE_FORMAT_RE = /^\+?[0-9\s\-().]+$/;

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!PHONE_FORMAT_RE.test(trimmed)) return false;
  const digitCount = trimmed.replace(/\D/g, '').length;
  return digitCount >= 7 && digitCount <= 15;
}