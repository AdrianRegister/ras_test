import { pool } from '../db/db.js';

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
