import { describe, expect, it } from 'vitest';
import { normalizeCif, normalizeEmail } from '../identifiers.js';

describe('normalizeCif', () => {
  it('trims whitespace and converts to uppercase', () => {
    expect(normalizeCif('  b12345678  ')).toBe('B12345678');
  });

  it('preserves internal characters without inventing a value', () => {
    expect(normalizeCif('x-123')).toBe('X-123');
  });

  it('returns null for empty values', () => {
    expect(normalizeCif('')).toBeNull();
    expect(normalizeCif('   ')).toBeNull();
    expect(normalizeCif(null)).toBeNull();
    expect(normalizeCif(undefined)).toBeNull();
  });
});

describe('normalizeEmail', () => {
  it('trims whitespace and converts to lowercase', () => {
    expect(normalizeEmail('  Contacto@Empresa.ES  ')).toBe('contacto@empresa.es');
  });

  it('preserves internal email formatting apart from case', () => {
    expect(normalizeEmail('First.Last+tag@Example.com')).toBe('first.last+tag@example.com');
  });

  it('returns null for empty values', () => {
    expect(normalizeEmail('')).toBeNull();
    expect(normalizeEmail('   ')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });
});
