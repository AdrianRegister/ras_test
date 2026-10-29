import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Mock both import spellings used by the backend.
vi.mock('./db/db.ts', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock('./db/db.js', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

describe('API authentication', () => {
  let app: (typeof import('../index.js'))['default'];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const module = await import('../index.ts');
    app = module.default;
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  it('rejects requests to clients without authentication', async () => {
    const response = await request(app).get('/api/clientes');

    expect(response.status).toBe(401);
  });

  it('rejects requests to countries without authentication', async () => {
    const response = await request(app).get('/api/paises');

    expect(response.status).toBe(401);
  });
});
