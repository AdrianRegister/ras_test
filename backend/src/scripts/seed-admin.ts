import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from '../db/db.ts';

const scrypt = promisify(scryptCallback);

async function main(): Promise<void> {
  const nombre = 'admin';
  const email = 'admin@localhost';
  const password = 'admin123';

  const existing = await pool.query('SELECT id FROM usuarios WHERE nombre = $1 OR email = $2', [
    nombre,
    email,
  ]);

  if (existing.rowCount && existing.rowCount > 0) {
    console.log('El usuario admin ya existe. No se ha modificado.');
    return;
  }

  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const passwordHash = `scrypt:${salt}:${derivedKey.toString('hex')}`;

  await pool.query(
    `INSERT INTO usuarios
       (nombre, email, password_hash, activo, created_at, updated_at, session_token)
     VALUES ($1, $2, $3, TRUE, NOW(), NOW(), NULL)`,
    [nombre, email, passwordHash],
  );

  console.log('Usuario admin creado correctamente.');
}

main()
  .catch((error) => {
    console.error('Error al crear el usuario admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
