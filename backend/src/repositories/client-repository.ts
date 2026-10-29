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
       p.nombre AS pais,
       e.nombre AS estado,
       co.nombre AS comercial
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
       AND ($4 = '' OR co.nombre = $4)
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
       AND ($4 = '' OR co.nombre = $4)`,
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
       c.codigo_postal,
       c.ciudad,
       p.nombre AS pais,
       e.nombre AS estado,
       co.nombre AS comercial,
       c.fecha_alta
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
         numero_factura,
         fecha_factura,
         base_imponible,
         iva_porcentaje,
         importe_iva,
         total
       FROM facturas
       WHERE cliente_id = $1
       ORDER BY fecha_factura DESC`,
      [id],
    ),
    pool.query(
      `SELECT COALESCE(SUM(total), 0) AS facturacion_acumulada
       FROM facturas
       WHERE cliente_id = $1`,
      [id],
    ),
  ]);

  return {
    ...clientResult.rows[0],
    contactos: contactsResult.rows,
    facturas: invoicesResult.rows,
    facturacion_acumulada: billingResult.rows[0].facturacion_acumulada,
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

export async function updateClient(id: number, data: ActualizarCliente) {
  const query = `
    UPDATE clientes
    SET
      empresa = $1,
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
    WHERE id = $11
      AND deleted_at IS NULL
    RETURNING *;
  `;

  const values = [
    data.empresa,
    normalizarNombre(data.empresa),
    data.cif,
    data.pais_id,
    data.estado_id,
    data.direccion ?? null,
    data.codigo_postal ?? null,
    data.ciudad ?? null,
    data.comercial_id ?? null,
    data.fecha_alta ?? null,
    id,
  ];

  const result = await pool.query(query, values);

  return result.rows[0] ?? null;
}
