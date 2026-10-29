import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

vi.mock('../db/db.ts', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock('../db/db.js', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

describe('POST /api/users/login', () => {
  let app: (typeof import('../index.js'))['default'];
  let pool: (typeof import('../db/db.js'))['pool'];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const db = await import('../db/db.js');
    pool = db.pool;

    const module = await import('../index.ts');
    app = module.default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/users/login').send({ nombre: 'admin' });

    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns 401 when the user does not exist', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as never);

    const response = await request(app)
      .post('/api/users/login')
      .send({ nombre: 'unknown-user', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('logs in successfully and returns a session cookie', async () => {
    const password = 'admin123';
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    const storedHash = `scrypt:${salt}:${hash.toString('hex')}`;

    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nombre: 'admin',
            password_hash: storedHash,
          },
        ],
        rowCount: 1,
      } as never)
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      } as never);

    const response = await request(app)
      .post('/api/users/login')
      .send({ nombre: 'admin', password });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Inicio de sesión correcto.',
      usuario: { id: 1, nombre: 'admin' },
    });

    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('session_token=');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');

    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});

describe('POST /api/users/logout', () => {
  let app: (typeof import('../index.js'))['default'];
  let pool: (typeof import('../db/db.js'))['pool'];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const db = await import('../db/db.js');
    pool = db.pool;

    const module = await import('../index.ts');
    app = module.default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears the session token and expires the cookie', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
    } as never);

    const response = await request(app)
      .post('/api/users/logout')
      .set('Cookie', 'session_token=test-session-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Sesión cerrada correctamente.',
    });

    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE usuarios SET session_token = NULL, updated_at = NOW() WHERE session_token = $1',
      ['test-session-token'],
    );

    expect(response.headers['set-cookie'][0]).toContain('session_token=');
    expect(response.headers['set-cookie'][0]).toContain('Expires=');
  });

  it('logs out without a cookie', async () => {
    const response = await request(app).post('/api/users/logout');

    expect(response.status).toBe(200);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
