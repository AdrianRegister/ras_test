import { pool, readCsv, findCompanyId, clean } from './import-utils.js';

async function main() {
  const rows = readCsv();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const name = clean(row.contacto);
      const email = clean(row.email);
      const phone = clean(row.telefono);

      // No contact information in this row.
      if (!name && !email && !phone) {
        continue;
      }

      const companyId = await findCompanyId(client, row);

      if (!companyId) {
        console.warn(`Skipping contact "${name}": company not found (${row.empresa}).`);
        skipped++;
        continue;
      }

      // Avoid importing the same contact more than once.
      const existing = await client.query(
        `SELECT id
         FROM contactos
         WHERE empresa_id = $1
           AND lower(trim(nombre)) = lower($2)
           AND lower(trim(COALESCE(email, ''))) = lower($3)
         LIMIT 1`,
        [companyId, name, email],
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      await client.query(
        `INSERT INTO contactos (empresa_id, nombre, email, telefono)
         VALUES ($1, $2, $3, $4)`,
        [companyId, name || null, email || null, phone || null],
      );

      inserted++;
    }

    await client.query('COMMIT');

    console.log(`Contacts imported: ${inserted}`);
    console.log(`Rows skipped: ${skipped}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Contact import failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
