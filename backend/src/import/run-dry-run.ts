import path from 'node:path';
import { runDryRun } from './dry-run.js';

const sourceFile = path.resolve(process.cwd(), 'backend', 'data', 'clientes_antiguos.csv');

try {
  const result = await runDryRun(sourceFile);

  console.log('Dry run completed.');
  console.log(`Source: ${path.basename(sourceFile)}`);
  console.log(`Total rows: ${result.summary.totalRows}`);
  console.log(`Ready: ${result.summary.readyRows}`);
  console.log(`Requires review: ${result.summary.reviewRows}`);
  console.log(`Rejected: ${result.summary.rejectedRows}`);
  console.log(`Duplicates: ${result.summary.duplicateRows}`);
  console.log(`Warnings: ${result.summary.warnings}`);
  console.log(`Errors: ${result.summary.errors}`);
  console.log(`Log: ${result.logPath}`);

  console.table(
    result.rows.map((row) => ({
      row: row.rowNumber,
      company: row.companyName,
      invoice: row.invoiceNumber ?? '-',
      status: row.status,
      reasons: row.reasons.join('; '),
    })),
  );
} catch (error) {
  console.error('Dry run failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
