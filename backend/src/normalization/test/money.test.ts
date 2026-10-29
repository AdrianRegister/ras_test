import { describe, expect, it } from 'vitest';
import { normalizeMoney } from '../money.js';

describe('normalizeMoney', () => {
  it('normalizes an integer amount', () => {
    expect(normalizeMoney('125')).toBe('125');
  });

  it('normalizes a Spanish thousands separator', () => {
    expect(normalizeMoney('1.250')).toBe('1250');
  });

  it('normalizes a Spanish amount with thousands and decimals', () => {
    expect(normalizeMoney('1.875,60')).toBe('1875.60');
  });

  it('normalizes an amount with a euro symbol', () => {
    expect(normalizeMoney('980,40 €')).toBe('980.40');
  });

  it('normalizes an amount with EUR suffix', () => {
    expect(normalizeMoney('980,40 EUR')).toBe('980.40');
  });

  it('pads a single decimal digit to two places', () => {
    expect(normalizeMoney('125,5')).toBe('125.50');
  });

  it('preserves zero decimal values', () => {
    expect(normalizeMoney('0,00')).toBe('0.00');
  });

  it('normalizes negative amounts', () => {
    expect(normalizeMoney('-125,50')).toBe('-125.50');
  });

  it('returns null for an empty value', () => {
    expect(normalizeMoney('')).toBeNull();
    expect(normalizeMoney('   ')).toBeNull();
    expect(normalizeMoney(null)).toBeNull();
    expect(normalizeMoney(undefined)).toBeNull();
  });

  it('rejects invalid characters', () => {
    expect(normalizeMoney('abc')).toBeNull();
    expect(normalizeMoney('12,30abc')).toBeNull();
  });

  it('rejects invalid thousands grouping', () => {
    expect(normalizeMoney('12.50')).toBeNull();
    expect(normalizeMoney('1.25.000')).toBeNull();
  });

  it('rejects more than two decimal places', () => {
    expect(normalizeMoney('125,500')).toBeNull();
  });

  it('rejects multiple decimal separators', () => {
    expect(normalizeMoney('1,20,30')).toBeNull();
  });
});
