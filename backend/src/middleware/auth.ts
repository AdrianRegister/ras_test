import type { Request, Response, NextFunction } from 'express';
import { pool } from '../db/db.js';

const COOKIE_NAME = 'session_token';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.cookie
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1);

    if (!token) {
      res.status(401).json({ error: 'No has iniciado sesión.' });
      return;
    }

    const result = await pool.query(
      `SELECT id
       FROM usuarios
       WHERE session_token = $1 AND activo = TRUE`,
      [token],
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: 'Sesión no válida.' });
      return;
    }

    res.locals.usuarioId = Number(result.rows[0].id);
    next();
  } catch (error) {
    console.error('Error al verificar la sesión:', error);
    res.status(500).json({ error: 'Error al verificar la sesión.' });
  }
}
