import { describe, expect, it } from 'vitest';
import { normalizeStatus } from '../src/status.js';

describe('normalizeStatus', () => {
  it.each([
    ['Activo', 'Activo'],
    ['activa', 'Activo'],
    ['ACTIVO', 'Activo'],
    ['Inactivo', 'Inactivo'],
    ['inactiva', 'Inactivo'],
    ['INACTIVO', 'Inactivo'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeStatus(input)).toBe(expected);
  });

  it('handles surrounding whitespace', () => {
    expect(normalizeStatus('  Activo  ')).toBe('Activo');
  });

  it('returns null for an empty value', () => {
    expect(normalizeStatus('')).toBeNull();
    expect(normalizeStatus(null)).toBeNull();
    expect(normalizeStatus(undefined)).toBeNull();
  });

  it('returns null for an unknown status', () => {
    expect(normalizeStatus('Pendiente')).toBeNull();
  });
});
