import { pool } from '../db/db.js';
import { normalizarNombre } from '../utils/utils.ts';
import type { ActualizarCliente } from '../validation/cliente-validation.ts';

export async function listClients(
  page: number,
  limit: number,
  search: string,
  estado: string,
  pais: string,
  comercial: string,
) {
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT DISTINCT
       c.id,
       c.empresa,
       c.cif,
       c.ciudad,
       p.codigo AS "paisCodigo",
       p.nombre AS "paisNombre",
       co.id AS "comercialId",
       co.nombre AS "comercialNombre",
       e.nombre AS estado
     FROM clientes c
     JOIN paises p ON p.id = c.pais_id
     JOIN estados e ON e.id = c.estado_id
     LEFT JOIN comerciales co ON co.id = c.comercial_id
     LEFT JOIN contactos ct ON ct.cliente_id = c.id
     WHERE c.deleted_at IS NULL
       AND (
         $1 = ''
         OR c.empresa ILIKE '%' || $1 || '%'
         OR c.cif ILIKE '%' || $1 || '%'
         OR ct.nombre ILIKE '%' || $1 || '%'
         OR ct.email ILIKE '%' || $1 || '%'
       )
       AND ($2 = '' OR e.nombre = $2)
       AND ($3 = '' OR p.codigo = $3)
       AND ($4 = '' OR c.comercial_id = $4::integer)
     ORDER BY c.empresa
     LIMIT $5 OFFSET $6`,
    [search, estado, pais, comercial, limit, offset],
  );

  const count = await pool.query(
    `SELECT COUNT(DISTINCT c.id) AS total
     FROM clientes c
     JOIN paises p ON p.id = c.pais_id
     JOIN estados e ON e.id = c.estado_id
     LEFT JOIN comerciales co ON co.id = c.comercial_id
     LEFT JOIN contactos ct ON ct.cliente_id = c.id
     WHERE c.deleted_at IS NULL
       AND (
         $1 = ''
         OR c.empresa ILIKE '%' || $1 || '%'
         OR c.cif ILIKE '%' || $1 || '%'
         OR ct.nombre ILIKE '%' || $1 || '%'
         OR ct.email ILIKE '%' || $1 || '%'
       )
       AND ($2 = '' OR e.nombre = $2)
       AND ($3 = '' OR p.codigo = $3)
       AND ($4 = '' OR c.comercial_id = $4::integer)`,
    [search, estado, pais, comercial],
  );

  return {
    items: result.rows,
    total: Number(count.rows[0].total),
    page,
    limit,
  };
}

export async function getClientById(id: string) {
  const clientResult = await pool.query(
    `SELECT
       c.id,
       c.empresa,
       c.cif,
       c.direccion,
       c.codigo_postal as "codigoPostal",
       c.ciudad,
       p.nombre AS "paisNombre",
       e.nombre AS estado,
       co.nombre AS "comercialNombre",
       c.fecha_alta as "fechaAlta",
       p.codigo AS "paisCodigo",
       co.id AS "comercialId"
     FROM clientes c
     JOIN paises p ON p.id = c.pais_id
     JOIN estados e ON e.id = c.estado_id
     LEFT JOIN comerciales co ON co.id = c.comercial_id
     WHERE c.id = $1
       AND c.deleted_at IS NULL`,
    [id],
  );

  if (clientResult.rows.length === 0) {
    return null;
  }

  const [contactsResult, invoicesResult, billingResult] = await Promise.all([
    pool.query(
      `SELECT DISTINCT nombre, email, telefono
       FROM contactos
       WHERE cliente_id = $1
       ORDER BY nombre`,
      [id],
    ),
    pool.query(
      `SELECT
         numero_factura as "numeroFactura",
         fecha_factura as "fechaFactura",
         base_imponible as "baseImponible",
         iva_porcentaje as "ivaPorcentaje",
         importe_iva as "importeIva",
         total
       FROM facturas
       WHERE cliente_id = $1
       ORDER BY fecha_factura DESC`,
      [id],
    ),
    pool.query(
      `SELECT COALESCE(SUM(total), 0) AS "facturacionAcumulada"
       FROM facturas
       WHERE cliente_id = $1`,
      [id],
    ),
  ]);

  return {
    ...clientResult.rows[0],
    contactos: contactsResult.rows,
    facturas: invoicesResult.rows,
    facturacionAcumulada: billingResult.rows[0].facturacionAcumulada,
  };
}

export async function createClient(data: {
  empresa: string;
  cif: string;
  pais_id: number;
  estado_id: number;
  direccion?: string | null;
  codigo_postal?: string | null;
  ciudad?: string | null;
  comercial_id?: number | null;
  fecha_alta?: string | null;
}) {
  const nombreNormalizado = normalizarNombre(data.empresa);

  const result = await pool.query(
    `INSERT INTO clientes (
       empresa, nombre_normalizado, cif, pais_id, estado_id,
       direccion, codigo_postal, ciudad, comercial_id, fecha_alta
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, empresa, cif, direccion, codigo_postal,
               ciudad, pais_id, estado_id, comercial_id, fecha_alta`,
    [
      data.empresa,
      nombreNormalizado,
      data.cif,
      data.pais_id,
      data.estado_id,
      data.direccion ?? null,
      data.codigo_postal ?? null,
      data.ciudad ?? null,
      data.comercial_id ?? null,
      data.fecha_alta ?? null,
    ],
  );

  return result.rows[0];
}

export async function updateClient(id: number, data: ActualizarCliente, usuarioId: any) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentResult = await client.query(
      `SELECT *
       FROM clientes
       WHERE id = $1 AND deleted_at IS NULL
       FOR UPDATE`,
      [id],
    );

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const current = currentResult.rows[0];

    const values = {
      empresa: data.empresa,
      cif: data.cif,
      pais_id: data.pais_id,
      estado_id: data.estado_id,
      direccion: data.direccion ?? null,
      codigo_postal: data.codigo_postal ?? null,
      ciudad: data.ciudad ?? null,
      comercial_id: data.comercial_id ?? null,
      fecha_alta: data.fecha_alta ?? null,
    };

    const updatedResult = await client.query(
      `UPDATE clientes
       SET empresa = $1,
           nombre_normalizado = $2,
           cif = $3,
           pais_id = $4,
           estado_id = $5,
           direccion = $6,
           codigo_postal = $7,
           ciudad = $8,
           comercial_id = $9,
           fecha_alta = $10,
           updated_at = NOW()
       WHERE id = $11 AND deleted_at IS NULL
       RETURNING *`,
      [
        values.empresa,
        normalizarNombre(values.empresa),
        values.cif,
        values.pais_id,
        values.estado_id,
        values.direccion,
        values.codigo_postal,
        values.ciudad,
        values.comercial_id,
        values.fecha_alta,
        id,
      ],
    );

    const updated = updatedResult.rows[0];

    for (const campo of Object.keys(values)) {
      const valorAnterior = current[campo];
      const valorNuevo = values[campo as keyof typeof values];

      const anterior =
        valorAnterior instanceof Date ? valorAnterior.toISOString().slice(0, 10) : valorAnterior;

      if (String(anterior ?? '') === String(valorNuevo ?? '')) {
        continue;
      }

      await client.query(
        `INSERT INTO historico_cambios
     (cliente_id, entidad_tipo, entidad_id, campo,
      valor_anterior, valor_nuevo, usuario_id, actor_tipo)
   VALUES ($1, 'cliente', $1, $2, $3, $4, $5, 'usuario')`,
        [
          id,
          campo,
          JSON.stringify(valorAnterior ?? null),
          JSON.stringify(valorNuevo ?? null),
          usuarioId,
        ],
      );
    }

    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getClientHistory(id: number) {
  const result = await pool.query(
    `SELECT
      id,
      cliente_id AS "clienteId",
      entidad_tipo AS "entidadTipo",
      entidad_id AS "entidadId",
      campo,
      valor_anterior AS "valorAnterior",
      valor_nuevo AS "valorNuevo",
      usuario_id AS "usuarioId",
      actor_tipo AS "actorTipo",
      fecha_hora AS "fechaHora"
     FROM historico_cambios
     WHERE cliente_id = $1
     ORDER BY fecha_hora DESC, id DESC`,
    [id],
  );

  return result.rows;
}

export async function deleteClient(id: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE clientes
     SET deleted_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
       AND deleted_at IS NULL
     RETURNING id`,
    [id],
  );

  return result.rowCount !== null && result.rowCount > 0;
}
