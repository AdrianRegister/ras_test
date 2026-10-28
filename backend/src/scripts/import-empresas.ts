import {
  clean,
  normalizeTaxId,
  normalizeCountry,
  parseDate,
  readCsv,
  pool,
} from './import-utils.js';

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const row of readCsv()) {
      const name = clean(row.empresa);
      const taxId = normalizeTaxId(row.cif);

      if (!name) continue;

      const companyIdResult = await client.query(
        `SELECT id FROM empresas
         WHERE (
           $1 <> ''
           AND regexp_replace(upper(cif), '[^A-Z0-9]', '', 'g') = $1
         )
         OR (
           $1 = ''
           AND lower(trim(razon_social)) = lower($2)
           AND lower(trim(direccion)) = lower($3)
           AND lower(trim(ciudad)) = lower($4)
         )
         LIMIT 1`,
        [taxId, name, clean(row.direccion), clean(row.ciudad)],
      );

      if (companyIdResult.rows.length) {
        // Link the existing company to its commercial
        // if it doesn't have one yet.
        const companyId = companyIdResult.rows[0].id;

        const commercial = await client.query(
          `SELECT id FROM comerciales
           WHERE lower(trim(nombre)) = lower($1)
           LIMIT 1`,
          [clean(row.comercial)],
        );

        if (commercial.rows.length) {
          await client.query(
            `UPDATE empresas
             SET comercial_id = COALESCE(comercial_id, $1)
             WHERE id = $2`,
            [commercial.rows[0].id, companyId],
          );
        }

        continue;
      }

      const registrationDate = parseDate(row.fecha_alta);

      if (!registrationDate) {
        console.warn(`Skipping company with invalid registration date: ${name}`);
        continue;
      }

      const commercial = await client.query(
        `SELECT id FROM comerciales
         WHERE lower(trim(nombre)) = lower($1)
         LIMIT 1`,
        [clean(row.comercial)],
      );

      if (!taxId) continue;
      if (taxId) {
        const existing = await client.query('SELECT id FROM empresas WHERE cif = $1', [taxId]);

        if (existing.rows.length) {
          console.warn(`Skipping ${name}: CIF ${taxId} already exists.`);
          continue;
        }
      }

      await client.query(
        `INSERT INTO empresas (
          razon_social, cif, direccion, codigo_postal,
          ciudad, pais, estado, fecha_alta, comercial_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          name,
          taxId || null,
          clean(row.direccion) || null,
          clean(row.cp) || null,
          clean(row.ciudad) || null,
          normalizeCountry(row.pais),
          clean(row.estado).toLowerCase() === 'inactivo' ? 'Inactivo' : 'Activo',
          registrationDate,
          commercial.rows[0]?.id ?? null,
        ],
      );

      console.log(`Created company: ${name}`);
    }

    await client.query('COMMIT');
    console.log('Empresas import completed.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
