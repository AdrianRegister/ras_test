import { describe, expect, it } from 'vitest';
import { normalizeDate } from '../date.js';

describe('normalizeDate', () => {
  it('normalizes a date in DD/MM/YYYY format', () => {
    expect(normalizeDate('25/10/2026')).toBe('2026-10-25');
  });

  it('normalizes a date in DD-MM-YYYY format', () => {
    expect(normalizeDate('25-10-2026')).toBe('2026-10-25');
  });

  it('normalizes a date in D/M/YY format', () => {
    expect(normalizeDate('5/2/26')).toBe('2026-02-05');
  });

  it('normalizes a date in YYYY-M-D format', () => {
    expect(normalizeDate('2026-2-5')).toBe('2026-02-05');
  });

  it('rejects an impossible calendar date', () => {
    expect(normalizeDate('31/09/2026')).toBeNull();
  });

  it('rejects an invalid date format', () => {
    expect(normalizeDate('2026/10/25')).toBeNull();
  });

  it('returns null for an empty value', () => {
    expect(normalizeDate('')).toBeNull();
    expect(normalizeDate('   ')).toBeNull();
  });
});
