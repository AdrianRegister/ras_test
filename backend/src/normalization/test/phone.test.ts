import { describe, expect, it } from 'vitest';
import { normalizePhone } from '../phone.js';

describe('normalizePhone', () => {
  it('normalizes a valid Spanish phone number', () => {
    const result = normalizePhone('+34 612 345 678', 'Empresa España SL', null, 'ES');

    expect(result.phone).toBe('+34612345678');
    expect(result.unresolved).toBe(false);
  });

  it('normalizes a valid Portuguese phone number', () => {
    const result = normalizePhone('+351 912 345 678', 'Empresa Portugal Lda', null, 'PT');

    expect(result.phone).toBe('+351912345678');
    expect(result.unresolved).toBe(false);
  });

  it('normalizes a valid French phone number', () => {
    const result = normalizePhone('+33 6 12 34 56 78', 'Entreprise France SARL', null, 'FR');

    expect(result.phone).toBe('+33612345678');
    expect(result.unresolved).toBe(false);
  });

  it('normalizes a valid Italian phone number', () => {
    const result = normalizePhone('+39 312 345 6789', 'Impresa Italia SRL', null, 'IT');

    expect(result.phone).toBe('+393123456789');
    expect(result.unresolved).toBe(false);
  });

  it('accepts an explicit international number regardless of the supplied country', () => {
    const result = normalizePhone('+33 6 12 34 56 78', 'Empresa España SL', null, 'ES');

    expect(result.phone).toBe('+33612345678');
    expect(result.unresolved).toBe(false);
  });

  it('normalizes a national-format number using the supplied country', () => {
    const result = normalizePhone('612 345 678', 'Empresa España SL', null, 'ES');

    expect(result.phone).toBe('+34612345678');
    expect(result.inferred).toBe(true);
    expect(result.unresolved).toBe(false);
  });

  it('returns unresolved for an invalid phone number', () => {
    const result = normalizePhone('123', 'Empresa España SL', null, 'ES');

    expect(result.phone).toBeNull();
    expect(result.unresolved).toBe(true);
  });

  it('returns null for an empty phone number without marking it unresolved', () => {
    const result = normalizePhone('', 'Empresa España SL', null, 'ES');

    expect(result.phone).toBeNull();
    expect(result.inferred).toBe(false);
    expect(result.unresolved).toBe(false);
  });

  it('returns unresolved for a national-format number when the country is missing', () => {
    const result = normalizePhone('612 345 678', 'Empresa España SL', null, null);

    expect(result.phone).toBeNull();
    expect(result.unresolved).toBe(true);
  });
});
