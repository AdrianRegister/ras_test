import { NumberParser } from '@internationalized/number';

const spanishNumberParser = new NumberParser('es-ES', {
  style: 'decimal',
});

/**
 * Converts a Spanish-formatted monetary value into an exact decimal string.
 *
 * Examples:
 *   "1.250"       -> "1250"
 *   "1.875,60"    -> "1875.60"
 *   "980,40 €"    -> "980.40"
 *   "125"         -> "125"
 *   ""            -> null
 *
 * Returns null when the input is empty or invalid.
 */
export function normalizeMoney(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  let input = String(value).trim().replace(/\s+/g, '').replace(/€/g, '').replace(/EUR/gi, '');

  if (!input) {
    return null;
  }

  // Allow a leading minus sign, but not a leading plus sign.
  const negative = input.startsWith('-');

  if (negative) {
    input = input.slice(1);
  }

  if (!input || !/^[\d.,]+$/.test(input)) {
    return null;
  }

  // Spanish formatting uses commas for decimals.
  const commaParts = input.split(',');

  if (commaParts.length > 2) {
    return null;
  }

  const integerPart = commaParts[0];
  const decimalPart = commaParts[1];

  // Validate thousands separators: groups after the first must have 3 digits.
  const integerGroups = integerPart.split('.');

  if (
    integerGroups.some((group) => !/^\d+$/.test(group)) ||
    (integerGroups.length > 1 &&
      (!/^\d{1,3}$/.test(integerGroups[0]) ||
        integerGroups.slice(1).some((group) => !/^\d{3}$/.test(group))))
  ) {
    return null;
  }

  if (decimalPart !== undefined && (!/^\d+$/.test(decimalPart) || decimalPart.length > 2)) {
    return null;
  }

  // Remove grouping separators without using floating-point arithmetic.
  const integerDigits = integerGroups.join('');

  const canonical =
    decimalPart === undefined ? integerDigits : `${integerDigits}.${decimalPart.padEnd(2, '0')}`;

  // Use the locale-aware parser to validate the numeric interpretation.
  const parsed = spanishNumberParser.parse(canonical.replace('.', ','));

  if (parsed === null || !Number.isFinite(parsed)) {
    return null;
  }

  // Keep the returned value as a decimal string for PostgreSQL NUMERIC.
  const normalized =
    decimalPart === undefined ? integerDigits : `${integerDigits}.${decimalPart.padEnd(2, '0')}`;

  return negative && !/^0(?:\.0+)?$/.test(normalized) ? `-${normalized}` : normalized;
}
