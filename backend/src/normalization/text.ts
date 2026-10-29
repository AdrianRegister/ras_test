/**
 * Converts an unknown value into clean text.
 * Returns an empty string for null or undefined.
 */
export function cleanText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Removes diacritical marks for case-insensitive text comparisons.
 * The original display value should be preserved separately.
 */
export function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
