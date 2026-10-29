import { fileURLToPath } from 'node:url';
import { readCsv } from '../../import/csv-reader.ts';
import { normalizeCsvRow } from '../normalize-csv-row.ts';

const csvPath = fileURLToPath(new URL('../../../data/clientes_antiguos.csv', import.meta.url));

const rows = await readCsv(csvPath);

let validClients = 0;
let invoices = 0;
let issues = 0;

for (const [index, row] of rows.entries()) {
  const result = normalizeCsvRow(index + 2, row);

  const hasClientErrors = result.issues.some(
    (entry) =>
      entry.severity === 'error' &&
      ![
        'MISSING_INVOICE_NUMBER',
        'INVALID_INVOICE_DATE',
        'INVALID_TAXABLE_BASE',
        'INVALID_VAT',
      ].includes(entry.code),
  );

  if (!hasClientErrors) {
    validClients++;
  }

  if (result.invoice !== null) invoices++;
  issues += result.issues.length;

  console.log({
    row: index + 2,
    company: result.companyName,
    cif: result.cif,
    invoice: result.invoice?.invoiceNumber ?? null,
    issues: result.issues.map((entry) => ({
      field: entry.field,
      code: entry.code,
      severity: entry.severity,
    })),
  });
}

console.log('\nSummary:', {
  rows: rows.length,
  clientsWithoutClientErrors: validClients,
  rowsWithInvoiceData: invoices,
  totalIssues: issues,
});
