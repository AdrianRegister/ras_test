import { createHash } from 'node:crypto';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import type { PoolClient } from 'pg';

import { pool } from '../db/db.js';
import { readCsv } from './csv-reader.js';
import { classifyImportRow } from './classify-import-row.js';
import { normalizeCsvRow } from '../normalization/normalize-csv-row.ts';
import type { ImportRowResult } from './import-types.js';

interface LookupRow {
  id: string;
  nombre?: string;
  codigo?: string;
  nombre_normalizado?: string;
}

async function findLookupId(
  client: PoolClient,
  table: 'paises' | 'estados' | 'comerciales',
  value: string | null,
): Promise<string | null> {
  if (!value) return null;

  if (table === 'paises') {
    const result = await client.query<LookupRow>(`SELECT id FROM paises WHERE codigo = $1`, [
      value,
    ]);
    return result.rows[0]?.id ?? null;
  }

  if (table === 'estados') {
    const result = await client.query<LookupRow>(
      `SELECT id FROM estados WHERE lower(nombre) = lower($1)`,
      [value],
    );
    return result.rows[0]?.id ?? null;
  }

  const result = await client.query<LookupRow>(
    `SELECT id FROM comerciales WHERE lower(nombre) = lower($1)`,
    [value],
  );
  return result.rows[0]?.id ?? null;
}

function addReason(row: ImportRowResult, reason: string): void {
  if (!row.reasons.includes(reason)) row.reasons.push(reason);
}

export async function importCsvData(sourceFile: string) {
  const absolutePath = path.resolve(sourceFile);
  const csvContent = await readFile(absolutePath);
  const checksum = createHash('sha256').update(csvContent).digest('hex');
  const csvRows = await readCsv(absolutePath);

  const rows: ImportRowResult[] = csvRows.map((csvRow, index) => {
    const rowNumber = index + 2;
    return classifyImportRow(rowNumber, normalizeCsvRow(rowNumber, csvRow));
  });

  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    const importResult = await connection.query<{ id: string }>(
      `INSERT INTO importaciones
        (nombre_archivo, checksum_sha256, estado, filas_totales)
       VALUES ($1, $2, 'iniciada', $3)
       RETURNING id`,
      [path.basename(absolutePath), checksum, rows.length],
    );

    const importId = importResult.rows[0].id;

    // This importer expects an empty destination, as confirmed for this run.
    const existing = await connection.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM clientes WHERE deleted_at IS NULL`,
    );

    if (Number(existing.rows[0].count) !== 0) {
      throw new Error(
        'Import cancelled: clientes is no longer empty. Run the dry-run and review matching first.',
      );
    }

    const clientsByName = new Map<string, string>();
    const invoicesSeen = new Set<string>();

    let importedRows = 0;
    let rejectedRows = 0;
    let duplicateRows = 0;

    for (const row of rows) {
      const data = row.normalized;

      const canonicalName =
        data.normalizedCompanyName === 'hotel mar blau' ? 'Hotel Mar Blau SA' : data.companyName;

      const canonicalKey =
        data.normalizedCompanyName === 'hotel mar blau'
          ? 'hotel mar blau sa'
          : data.normalizedCompanyName;

      const countryId = await findLookupId(connection, 'paises', data.countryCode);
      const statusId = await findLookupId(connection, 'estados', data.status);
      const salespersonId = await findLookupId(connection, 'comerciales', data.salesperson);

      const clientErrors = data.issues.filter(
        (issue) =>
          issue.severity === 'error' &&
          ![
            'MISSING_INVOICE_NUMBER',
            'INVALID_INVOICE_DATE',
            'INVALID_TAXABLE_BASE',
            'INVALID_VAT',
          ].includes(issue.code),
      );

      if (clientErrors.length > 0 || !countryId || !statusId) {
        rejectedRows++;

        for (const issue of data.issues) {
          await connection.query(
            `INSERT INTO incidencias_importacion
              (importacion_id, fila_csv, tipo, severidad, descripcion, datos_originales)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
            [
              importId,
              row.rowNumber,
              issue.code,
              issue.severity,
              issue.message,
              JSON.stringify({ field: issue.field, value: issue.originalValue }),
            ],
          );
        }

        if (!countryId || !statusId) {
          await connection.query(
            `INSERT INTO incidencias_importacion
              (importacion_id, fila_csv, tipo, severidad, descripcion, datos_originales)
             VALUES ($1, $2, $3, 'error', $4, $5::jsonb)`,
            [
              importId,
              row.rowNumber,
              'UNKNOWN_LOOKUP',
              'Country or status was not found in the database.',
              JSON.stringify({
                countryCode: data.countryCode,
                status: data.status,
              }),
            ],
          );
        }

        continue;
      }

      let clientId = clientsByName.get(canonicalKey);

      if (!clientId) {
        const inserted = await connection.query<{ id: string }>(
          `INSERT INTO clientes
            (empresa, nombre_normalizado, cif, direccion, codigo_postal,
             ciudad, pais_id, comercial_id, fecha_alta, estado_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            canonicalName,
            canonicalKey,
            data.cif,
            data.address,
            data.postalCode,
            data.city,
            countryId,
            salespersonId,
            data.creationDate,
            statusId,
          ],
        );

        clientId = inserted.rows[0].id;
        clientsByName.set(canonicalKey, clientId);
      }

      if (data.contactName) {
        await connection.query(
          `INSERT INTO contactos (cliente_id, nombre, email, telefono)
           VALUES ($1, $2, $3, $4)`,
          [clientId, data.contactName, data.email, data.phone],
        );
      }

      importedRows++;

      for (const issue of data.issues) {
        await connection.query(
          `INSERT INTO incidencias_importacion
            (importacion_id, fila_csv, tipo, severidad, descripcion, datos_originales)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
          [
            importId,
            row.rowNumber,
            issue.code,
            issue.severity,
            issue.message,
            JSON.stringify({ field: issue.field, value: issue.originalValue }),
          ],
        );
      }

      if (!data.invoice) continue;

      const invoiceErrors = data.issues.filter(
        (issue) =>
          issue.severity === 'error' &&
          [
            'MISSING_INVOICE_NUMBER',
            'INVALID_INVOICE_DATE',
            'INVALID_TAXABLE_BASE',
            'INVALID_VAT',
          ].includes(issue.code),
      );

      if (invoiceErrors.length > 0) continue;

      const invoiceKey = `${clientId}:${data.invoice.invoiceNumber}`;

      if (invoicesSeen.has(invoiceKey)) {
        duplicateRows++;

        await connection.query(
          `INSERT INTO incidencias_importacion
            (importacion_id, fila_csv, tipo, severidad, descripcion, datos_originales)
           VALUES ($1, $2, 'DUPLICATE_INVOICE', 'warning', $3, $4::jsonb)`,
          [
            importId,
            row.rowNumber,
            `Duplicate invoice ${data.invoice.invoiceNumber} for this client.`,
            JSON.stringify({ invoiceNumber: data.invoice.invoiceNumber }),
          ],
        );

        continue;
      }

      invoicesSeen.add(invoiceKey);

      await connection.query(
        `INSERT INTO facturas
          (cliente_id, numero_factura, fecha_factura, base_imponible, iva_porcentaje)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          clientId,
          data.invoice.invoiceNumber,
          data.invoice.invoiceDate,
          data.invoice.taxableBase,
          data.invoice.vatPercent,
        ],
      );
    }

    await connection.query(
      `UPDATE importaciones
       SET estado = 'completada',
           filas_importadas = $2,
           filas_rechazadas = $3,
           filas_duplicadas = $4,
           finalizado_en = now()
       WHERE id = $1`,
      [importId, importedRows, rejectedRows, duplicateRows],
    );

    await connection.query('COMMIT');

    return {
      importId,
      totalRows: rows.length,
      importedRows,
      rejectedRows,
      duplicateRows,
    };
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}
