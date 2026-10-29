import { describe, expect, it } from 'vitest';
import { normalizeCompanyName } from '../company.js';
describe('normalizeCompanyName', () => {
  it('normalizes capitalization and whitespace', () => {
    expect(normalizeCompanyName('  CONSTRUCCIONES   EBRO SL  ')).toBe('construcciones ebro sl');
  });
  it('normalizes punctuation in Spanish legal suffixes', () => {
    expect(normalizeCompanyName('CONSTRUCCIONES EBRO, S.L.')).toBe('construcciones ebro sl');
  });
  it('removes accents for matching', () => {
    expect(normalizeCompanyName('Clínica Dental Sonrisa SLP')).toBe('clinica dental sonrisa slp');
  });
  it('preserves the SL suffix', () => {
    expect(normalizeCompanyName('Hotel Mar Blau SL')).toBe('hotel mar blau sl');
  });
  it('preserves the SA suffix', () => {
    expect(normalizeCompanyName('Hotel Mar Blau SA')).toBe('hotel mar blau sa');
  });
  it('preserves the SLP suffix', () => {
    expect(normalizeCompanyName('Clínica Dental Sonrisa S.L.P.')).toBe(
      'clinica dental sonrisa slp',
    );
  });
  it('preserves the SRL suffix', () => {
    expect(normalizeCompanyName('Logística Duero S.R.L.')).toBe('logistica duero srl');
  });
  it('preserves the SARL suffix', () => {
    expect(normalizeCompanyName('Entreprise Exemple SARL')).toBe('entreprise exemple sarl');
  });
  it('preserves the Lda suffix', () => {
    expect(normalizeCompanyName('Empresa Exemplo Lda')).toBe('empresa exemplo lda');
  });
  it('does not merge names with different legal suffixes', () => {
    expect(normalizeCompanyName('Hotel Mar Blau SL')).not.toBe(
      normalizeCompanyName('Hotel Mar Blau SA'),
    );
  });
  it('returns an empty string for an empty value', () => {
    expect(normalizeCompanyName('')).toBe('');
  });
});
