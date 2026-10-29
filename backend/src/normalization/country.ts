import { cleanText, stripDiacritics } from './text.js';

const COUNTRY_ALIASES: Record<string, string> = {
  es: 'ES',
  espana: 'ES',
  spain: 'ES',
  pt: 'PT',
  portugal: 'PT',
  fr: 'FR',
  francia: 'FR',
  france: 'FR',
  it: 'IT',
  italia: 'IT',
  italy: 'IT',
};

export function normalizeCountry(value: unknown): string | null {
  const country = stripDiacritics(cleanText(value)).toLocaleLowerCase('es-ES');

  if (!country) {
    return null;
  }

  return COUNTRY_ALIASES[country] ?? null;
}

export function inferCountryCode(value: unknown): string | null {
  return normalizeCountry(value);
}
