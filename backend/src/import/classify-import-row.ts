import type { ImportRowResult, ImportRowStatus } from './import-types.js';
import type { NormalizedClientFields } from './import-types.js';

const INVOICE_ERROR_CODES = new Set([
  'MISSING_INVOICE_NUMBER',
  'INVALID_INVOICE_DATE',
  'INVALID_TAXABLE_BASE',
  'INVALID_VAT',
]);

export function classifyImportRow(
  rowNumber: number,
  normalized: NormalizedClientFields,
): ImportRowResult {
  const clientErrors = normalized.issues.filter(
    (entry) => entry.severity === 'error' && !INVOICE_ERROR_CODES.has(entry.code),
  );

  const invoiceErrors = normalized.issues.filter(
    (entry) => entry.severity === 'error' && INVOICE_ERROR_CODES.has(entry.code),
  );

  let status: ImportRowStatus;

  if (clientErrors.length > 0) {
    status = 'REJECTED';
  } else if (invoiceErrors.length > 0 && normalized.invoice !== null) {
    status = 'PARTIALLY_VALID';
  } else {
    // Provisional: database matching and duplicate checks are still required.
    status = 'REVIEW_REQUIRED';
  }

  return {
    rowNumber,
    status,
    companyName: normalized.companyName,
    invoiceNumber: normalized.invoice?.invoiceNumber ?? null,
    reasons: [...clientErrors, ...invoiceErrors].map((entry) => `${entry.field}: ${entry.message}`),
    issues: normalized.issues,
    normalized,
  };
}
