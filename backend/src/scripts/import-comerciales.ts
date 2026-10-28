import { clean, normalizeName, readCsv, pool } from './import-utils.js';

async function main() {
  const client = await pool.connect();

  try {
    const names = new Map<string, string>();

    for (const row of readCsv()) {
      const name = clean(row.comercial);
      if (name) names.set(normalizeName(name), name);
    }

    await client.query('BEGIN');

    for (const name of names.values()) {
      const existing = await client.query(
        `SELECT id FROM comerciales
         WHERE lower(trim(nombre)) = lower($1)
         LIMIT 1`,
        [name],
      );

      if (existing.rows.length) continue;

      await client.query('INSERT INTO comerciales (nombre) VALUES ($1)', [name]);

      console.log(`Created commercial: ${name}`);
    }

    await client.query('COMMIT');
    console.log('Comerciales import completed.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
