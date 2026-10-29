import { cleanText, stripDiacritics } from './text.js';

export type ClientStatus = 'Activo' | 'Inactivo';

export function normalizeStatus(value: unknown): ClientStatus | null {
  const status = stripDiacritics(cleanText(value)).toLowerCase();

  switch (status) {
    case 'activo':
    case 'activa':
      return 'Activo';

    case 'inactivo':
    case 'inactiva':
      return 'Inactivo';

    default:
      return null;
  }
}
