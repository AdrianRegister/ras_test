import { cleanText, stripDiacritics } from './text.js';

export function normalizeCompanyName(value: unknown): string {
  const name = cleanText(value);

  return stripDiacritics(name)
    .toLocaleLowerCase('es-ES')
    .replace(/[.,;:'"`´]/g, '')
    .replace(/\bs\s*\.?\s*l\s*\.?\s*p\b/g, ' slp ')
    .replace(/\bs\s*\.?\s*r\s*\.?\s*l\b/g, ' srl ')
    .replace(/\bs\s*\.?\s*a\s*\.?\b/g, ' sa ')
    .replace(/\bs\s*\.?\s*l\s*\.?\b/g, ' sl ')
    .replace(/\bsarl\b/g, ' sarl ')
    .replace(/\blda\b/g, ' lda ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
