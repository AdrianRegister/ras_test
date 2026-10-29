import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type ImportMode = 'dry-run' | 'import';

export interface ImportLogSummary {
  sourceFile: string;
  startedAt: string;
  finishedAt: string;
  totalRows: number;
  readyRows: number;
  reviewRows: number;
  rejectedRows: number;
  duplicateRows: number;
  warnings: number;
  errors: number;
}

export async function writeImportLog(mode: ImportMode, summary: ImportLogSummary): Promise<string> {
  const logDirectory = path.resolve(process.cwd(), 'logs', 'db');

  await mkdir(logDirectory, { recursive: true });

  const timestamp = summary.finishedAt
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('T', '-')
    .replace('Z', '');

  const logPath = path.join(logDirectory, `${mode}-${timestamp}.log`);

  const content = [
    `Mode: ${mode}`,
    `Source file: ${path.basename(summary.sourceFile)}`,
    `Started at: ${summary.startedAt}`,
    `Finished at: ${summary.finishedAt}`,
    `Total rows: ${summary.totalRows}`,
    `Ready rows: ${summary.readyRows}`,
    `Rows requiring review: ${summary.reviewRows}`,
    `Rejected rows: ${summary.rejectedRows}`,
    `Duplicate rows: ${summary.duplicateRows}`,
    `Warnings: ${summary.warnings}`,
    `Errors: ${summary.errors}`,
    '',
  ].join('\n');

  await writeFile(content ? logPath : logPath, content, {
    encoding: 'utf8',
    flag: 'wx',
  });

  return logPath;
}
