import { Router } from 'express';
import { randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from '../db/db.js';

const router = Router();
const scrypt = promisify(scryptCallback);

const COOKIE_NAME = 'session_token';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_MS,
  };
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, expectedHex] = storedHash.split(':');

  if (algorithm !== 'scrypt' || !salt || !expectedHex || !/^[0-9a-f]+$/i.test(expectedHex)) {
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

router.post('/login', async (req, res) => {
  try {
    const { nombre, password } = req.body ?? {};

    if (typeof nombre !== 'string' || typeof password !== 'string' || !nombre.trim() || !password) {
      res.status(400).json({ error: 'Nombre y contraseña son obligatorios.' });
      return;
    }

    const result = await pool.query(
      `SELECT id, nombre, password_hash
       FROM usuarios
       WHERE nombre = $1 AND activo = TRUE`,
      [nombre.trim()],
    );

    const user = result.rows[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ error: 'Credenciales incorrectas.' });
      return;
    }

    const token = randomUUID();

    await pool.query('UPDATE usuarios SET session_token = $1, updated_at = NOW() WHERE id = $2', [
      token,
      user.id,
    ]);

    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.json({
      message: 'Inicio de sesión correcto.',
      usuario: { id: user.id, nombre: user.nombre },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'No se ha podido iniciar sesión.' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.cookie
      ?.split('; ')
      .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
      ?.split('=')
      .slice(1)
      .join('=');

    if (typeof token === 'string') {
      await pool.query(
        'UPDATE usuarios SET session_token = NULL, updated_at = NOW() WHERE session_token = $1',
        [token],
      );
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({ message: 'Sesión cerrada correctamente.' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ error: 'No se ha podido cerrar la sesión.' });
  }
});

export default router;
