import path from 'node:path';
import { readCsv } from './csv-reader.js';
import { classifyImportRow } from './classify-import-row.js';
import { writeImportLog } from './import-logger.js';
import { matchCsvClients } from './match-csv-clients.js';
import { normalizeCsvRow } from '../normalization/normalize-csv-row.ts';
import type { ImportRowResult } from './import-types.js';

export async function runDryRun(sourceFile: string) {
  const startedAt = new Date().toISOString();
  const absolutePath = path.resolve(sourceFile);
  const csvRows = await readCsv(absolutePath);

  const rows: ImportRowResult[] = csvRows.map((csvRow, index) => {
    const rowNumber = index + 2;
    const normalized = normalizeCsvRow(rowNumber, csvRow);

    return classifyImportRow(rowNumber, normalized);
  });

  // Match rows that refer to the same client.
  const clientMatches = matchCsvClients(rows);

  const matchesByRow = new Map(clientMatches.map((match) => [match.rowNumber, match]));

  for (const row of rows) {
    const match = matchesByRow.get(row.rowNumber);

    if (!match) continue;

    if (match.status === 'REVIEW_REQUIRED') {
      row.status = 'REVIEW_REQUIRED';

      if (match.reason) {
        row.reasons.push(match.reason);
      }
    } else if (match.canonicalRowNumber !== row.rowNumber && match.reason) {
      row.reasons.push(match.reason);
    }
  }

  // Detect duplicate invoice numbers for the same canonical CSV client.
  const firstInvoiceRow = new Map<string, number>();

  for (const row of rows) {
    const invoiceNumber = row.invoiceNumber;

    if (!invoiceNumber) continue;

    const match = matchesByRow.get(row.rowNumber);
    const clientKey = match ? String(match.canonicalRowNumber) : String(row.rowNumber);

    const invoiceKey = `${clientKey}:${invoiceNumber}`;
    const firstRow = firstInvoiceRow.get(invoiceKey);

    if (firstRow !== undefined) {
      row.status = 'DUPLICATE';
      row.reasons.push(
        `Invoice ${invoiceNumber} for this client also appears on CSV row ${firstRow}.`,
      );
    } else {
      firstInvoiceRow.set(invoiceKey, row.rowNumber);
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

  return {
    rows,
    summary,
    logPath,
    clientMatches,
  };
}
