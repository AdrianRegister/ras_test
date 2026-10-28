import {
  pool,
  readCsv,
  findCompanyId,
  clean,
  parseDate,
  parseAmount,
  parseVat,
} from './import-utils.js';

async function main() {
  const rows = readCsv();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const invoiceNumber = clean(row.factura);

      // Companies without an invoice are valid.
      if (!invoiceNumber) {
        continue;
      }

      const existing = await client.query(
        `SELECT id
         FROM facturas
         WHERE numero = $1
         LIMIT 1`,
        [invoiceNumber],
      );

      if (existing.rows.length > 0) {
        console.warn(`Skipping invoice ${invoiceNumber}: already exists.`);
        skipped++;
        continue;
      }

      const companyId = await findCompanyId(client, row);

      if (!companyId) {
        console.warn(`Skipping invoice ${invoiceNumber}: company not found (${row.empresa}).`);
        skipped++;
        continue;
      }

      const invoiceDate = parseDate(clean(row.fecha_factura));
      const amount = parseAmount(clean(row.base_imponible));
      const vat = parseVat(clean(row.iva));

      if (!invoiceDate) {
        console.warn(`Skipping invoice ${invoiceNumber}: invalid date "${row.fecha_factura}".`);
        skipped++;
        continue;
      }

      if (amount === null || vat === null) {
        console.warn(`Skipping invoice ${invoiceNumber}: invalid amount or VAT.`);
        skipped++;
        continue;
      }

      await client.query(
        `INSERT INTO facturas (
           empresa_id,
           numero,
           fecha_factura,
           base_imponible,
           iva_porcentaje
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [companyId, invoiceNumber, invoiceDate, amount, vat],
      );

      inserted++;
    }

    await client.query('COMMIT');

    console.log(`Invoices imported: ${inserted}`);
    console.log(`Rows skipped: ${skipped}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Invoice import failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
