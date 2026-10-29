import { describe, expect, it } from 'vitest';
import { inferCountryCode, normalizeCountry } from '../country.js';

describe('normalizeCountry', () => {
  it.each([
    ['España', 'ES'],
    ['Spain', 'ES'],
    ['ES', 'ES'],
    ['Portugal', 'PT'],
    ['PT', 'PT'],
    ['Francia', 'FR'],
    ['France', 'FR'],
    ['FR', 'FR'],
    ['Italia', 'IT'],
    ['Italy', 'IT'],
    ['IT', 'IT'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeCountry(input)).toBe(expected);
  });

  it('handles surrounding whitespace and capitalization', () => {
    expect(normalizeCountry('  ESPAÑA  ')).toBe('ES');
  });

  it('returns null for an empty value', () => {
    expect(normalizeCountry('')).toBeNull();
    expect(normalizeCountry(null)).toBeNull();
    expect(normalizeCountry(undefined)).toBeNull();
  });

  it('returns null for an unknown country', () => {
    expect(normalizeCountry('Germany')).toBeNull();
  });
});

describe('inferCountryCode', () => {
  it('uses the same alias mapping as normalizeCountry', () => {
    expect(inferCountryCode('España')).toBe('ES');
    expect(inferCountryCode('Portugal')).toBe('PT');
  });
});
