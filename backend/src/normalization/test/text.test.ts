import { describe, expect, it } from 'vitest';
import { cleanText, stripDiacritics } from '../text.js';

describe('cleanText', () => {
  it('trims leading and trailing whitespace', () => {
    expect(cleanText('  Empresa SL  ')).toBe('Empresa SL');
  });

  it('replaces repeated whitespace with a single space', () => {
    expect(cleanText('Clínica   Dental\tSonrisa')).toBe('Clínica Dental Sonrisa');
  });

  it('returns an empty string for an empty value', () => {
    expect(cleanText('')).toBe('');
  });

  it('returns an empty string for null or undefined', () => {
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
  });

  it('converts numbers to text', () => {
    expect(cleanText(123)).toBe('123');
  });
});

describe('stripDiacritics', () => {
  it('removes Spanish accents', () => {
    expect(stripDiacritics('Clínica Dental España')).toBe('Clinica Dental Espana');
  });

  it('removes accents from other languages', () => {
    expect(stripDiacritics('João, Lumière, Málaga')).toBe('Joao, Lumiere, Malaga');
  });

  it('leaves ordinary ASCII text unchanged', () => {
    expect(stripDiacritics('Construcciones Ebro SL')).toBe('Construcciones Ebro SL');
  });

  it('handles an empty string', () => {
    expect(stripDiacritics('')).toBe('');
  });
});
