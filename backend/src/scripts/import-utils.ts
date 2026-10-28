import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { pool } from '../db/db.js';

dayjs.extend(customParseFormat);

export type CsvRow = {
  empresa: string;
  cif: string;
  contacto: string;
  email: string;
  telefono: string;
  direccion: string;
  cp: string;
  ciudad: string;
  pais: string;
  comercial: string;
  estado: string;
  fecha_alta: string;
  factura: string;
  fecha_factura: string;
  base_imponible: string;
  iva: string;
};

export const clean = (value: string | undefined) => (value ?? '').trim().replace(/\s+/g, ' ');

export const normalizeName = (value: string) => clean(value).normalize('NFC').toLowerCase();

export const normalizeTaxId = (value: string) =>
  clean(value)
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

export function readCsv(): CsvRow[] {
  const content = readFileSync('data/clientes_antiguos.csv', 'utf8');

  return parse(content, {
    columns: true,
    delimiter: ';',
    bom: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
}

export function parseDate(value: string): string | null {
  const input = clean(value);

  const formats = ['DD/MM/YYYY', 'D/M/YY', 'D/M/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'];

  for (const format of formats) {
    const date = dayjs(input, format, true);

    if (date.isValid()) {
      return date.format('YYYY-MM-DD');
    }
  }

  return null;
}

export function parseAmount(value: string): string | null {
  let amount = clean(value).replace(/[€\s]/g, '');

  if (!amount) return null;

  if (amount.includes(',')) {
    amount = amount.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(amount)) {
    amount = amount.replace(/\./g, '');
  }

  if (!/^-?\d+(\.\d+)?$/.test(amount)) {
    throw new Error(`Invalid amount: ${value}`);
  }

  return Number(amount).toFixed(2);
}

export function parseVat(value: string): string | null {
  const input = clean(value).replace(/%/g, '').replace(',', '.');

  if (!input) return null;

  const rate = Number(input);

  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new Error(`Invalid VAT: ${value}`);
  }

  return rate.toFixed(2);
}

export function normalizeCountry(value: string): string {
  const countries: Record<string, string> = {
    españa: 'ES',
    spain: 'ES',
    es: 'ES',
    italia: 'IT',
    italy: 'IT',
    it: 'IT',
    portugal: 'PT',
    pt: 'PT',
    francia: 'FR',
    france: 'FR',
    fr: 'FR',
  };

  return countries[clean(value).toLowerCase()] ?? clean(value).toUpperCase();
}

export async function findCompanyId(
  client: import('pg').PoolClient,
  row: CsvRow,
): Promise<number | null> {
  const taxId = normalizeTaxId(row.cif);

  if (!taxId) {
    return null;
  }

  const result = await client.query(
    `SELECT id
     FROM empresas
     WHERE regexp_replace(upper(cif), '[^A-Z0-9]', '', 'g') = $1
     LIMIT 1`,
    [taxId],
  );

  return result.rows[0]?.id ?? null;
}

export { pool };
