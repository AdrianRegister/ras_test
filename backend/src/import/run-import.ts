import 'dotenv/config';

import path from 'node:path';
import { importCsvData } from './import-data.js';
import { pool } from '../db/db.js';

const sourceFile = path.resolve(process.cwd(), 'data', 'clientes_antiguos.csv');

try {
  const result = await importCsvData(sourceFile);

  console.log('Import completed.');
  console.table(result);
} catch (error) {
  console.error('Import failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
