import path from 'node:path';
import { readCsv } from './csv-reader.js';
import { classifyImportRow } from './classify-import-row.js';
import { writeImportLog } from './import-logger.js';
import { normalizeCsvRow } from '../normalization/normalize-csv-row.ts';
import type { ImportRowResult } from './import-types.js';

export async function runDryRun(sourceFile: string) {
  const startedAt = new Date().toISOString();
  const absolutePath = path.resolve(sourceFile);
  const csvRows = await readCsv(absolutePath);

  const rows: ImportRowResult[] = csvRows.map((csvRow, index) => {
    const normalized = normalizeCsvRow(index + 2, csvRow);
    return classifyImportRow(index + 2, normalized);
  });

  const firstInvoiceRow = new Map<string, number>();

  for (const row of rows) {
    const invoiceNumber = row.invoiceNumber;

    if (!invoiceNumber) continue;

    const firstRow = firstInvoiceRow.get(invoiceNumber);

    if (firstRow !== undefined) {
      row.status = 'DUPLICATE';
      row.reasons.push(`Invoice ${invoiceNumber} also appears on CSV row ${firstRow}.`);
    } else {
      firstInvoiceRow.set(invoiceNumber, row.rowNumber);
    }
  }

  const finishedAt = new Date().toISOString();

  const summary = {
    sourceFile: absolutePath,
    startedAt,
    finishedAt,
    totalRows: rows.length,
    readyRows: rows.filter((row) => row.status === 'READY').length,
    reviewRows: rows.filter((row) => row.status === 'REVIEW_REQUIRED').length,
    rejectedRows: rows.filter((row) => row.status === 'REJECTED').length,
    duplicateRows: rows.filter((row) => row.status === 'DUPLICATE').length,
    warnings: rows.reduce(
      (count, row) => count + row.issues.filter((issue) => issue.severity === 'warning').length,
      0,
    ),
    errors: rows.reduce(
      (count, row) => count + row.issues.filter((issue) => issue.severity === 'error').length,
      0,
    ),
  };

  const logPath = await writeImportLog('dry-run', summary);

  return { rows, summary, logPath };
}
