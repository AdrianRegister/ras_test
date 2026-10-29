import { parse } from 'csv/sync';
import { readFile } from 'node:fs/promises';

export type CsvRow = Record<string, string>;

export async function readCsv(filePath: string): Promise<CsvRow[]> {
  const content = await readFile(filePath, 'utf8');

  return parse(content, {
    bom: true,
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
    trim: true,
    relax_column_count: false,
  }) as CsvRow[];
}
