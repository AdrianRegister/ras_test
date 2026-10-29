import { cleanText } from './text.js';

/**
 * Normalizes a CIF for comparison.
 * Returns null when the value is empty.
 * Does not attempt to validate or repair the CIF.
 */
export function normalizeCif(value: unknown): string | null {
  const cif = cleanText(value).toUpperCase();

  return cif || null;
}

/**
 * Normalizes an email address for comparison.
 * Returns null when the value is empty.
 * Validation is handled separately by the row normalizer.
 */
export function normalizeEmail(value: unknown): string | null {
  const email = cleanText(value).toLowerCase();

  return email || null;
}
