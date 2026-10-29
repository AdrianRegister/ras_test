import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

const DATE_FORMATS = ['DD/MM/YYYY', 'DD-MM-YYYY', 'D/M/YY', 'YYYY-M-D'];

export function normalizeDate(value: unknown): string | null {
  const input = String(value ?? '').trim();

  if (!input) {
    return null;
  }

  for (const format of DATE_FORMATS) {
    const parsed = dayjs(input, format, true);

    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
  }

  return null;
}
