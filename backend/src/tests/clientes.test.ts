import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

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

vi.mock('../repositories/client-repository.js', () => ({
  listClients: vi.fn(),
  getClientById: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  getClientHistory: vi.fn(),
  deleteClient: vi.fn(),
}));

describe('Client API validation', () => {
  let app: (typeof import('../index.js'))['default'];
  let pool: (typeof import('../db/db.js'))['pool'];
  let repository: typeof import('../repositories/client-repository.js');

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    pool = (await import('../db/db.js')).pool;
    repository = await import('../repositories/client-repository.js');
    app = (await import('../index.ts')).default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for an invalid client ID', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 1 }],
      rowCount: 1,
    } as never);

    const response = await request(app)
      .put('/api/clientes/abc')
      .set('Cookie', 'session_token=test-token')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('ID de cliente no válido');
    expect(repository.updateClient).not.toHaveBeenCalled();
  });

  it('returns 400 when client data fails validation', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 1 }],
      rowCount: 1,
    } as never);

    const response = await request(app)
      .put('/api/clientes/1')
      .set('Cookie', 'session_token=test-token')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Datos del cliente no válidos');
    expect(repository.updateClient).not.toHaveBeenCalled();
  });

  it('creates a client when the data is valid', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 1 }],
      rowCount: 1,
    } as never);

    const newClient = {
      empresa: '  Empresa de prueba  ',
      cif: 'b12345678',
      pais_id: 1,
      estado_id: 1,
      ciudad: 'Barcelona',
    };

    const createdClient = {
      id: 42,
      ...newClient,
      empresa: 'Empresa de prueba',
      cif: 'B12345678',
    };

    vi.mocked(repository.createClient).mockResolvedValueOnce(createdClient as never);

    const response = await request(app)
      .post('/api/clientes')
      .set('Cookie', 'session_token=test-token')
      .send(newClient);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(createdClient);

    expect(repository.createClient).toHaveBeenCalledOnce();
    expect(repository.createClient).toHaveBeenCalledWith({
      empresa: 'Empresa de prueba',
      cif: 'B12345678',
      pais_id: 1,
      estado_id: 1,
      ciudad: 'Barcelona',
    });
  });

  it('returns a client when it exists', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 1 }],
      rowCount: 1,
    } as never);

    const client = {
      id: 42,
      empresa: 'Empresa de prueba',
      cif: 'B12345678',
      pais_id: 1,
      estado_id: 1,
    };

    vi.mocked(repository.getClientById).mockResolvedValueOnce(client as never);

    const response = await request(app)
      .get('/api/clientes/42')
      .set('Cookie', 'session_token=test-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(client);
    expect(repository.getClientById).toHaveBeenCalledWith('42');
  });

  it('returns 404 when the client does not exist', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 1 }],
      rowCount: 1,
    } as never);

    vi.mocked(repository.getClientById).mockResolvedValueOnce(null as never);

    const response = await request(app)
      .get('/api/clientes/999')
      .set('Cookie', 'session_token=test-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Cliente no encontrado',
    });
  });

  it('lists clients with the requested pagination and filters', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 1 }],
      rowCount: 1,
    } as never);

    const result = {
      data: [
        {
          id: 42,
          empresa: 'Empresa de prueba',
          cif: 'B12345678',
          pais_id: 1,
          estado_id: 1,
        },
      ],
      total: 1,
      page: 2,
      limit: 5,
    };

    vi.mocked(repository.listClients).mockResolvedValueOnce(result as never);

    const response = await request(app)
      .get('/api/clientes')
      .query({
        page: 2,
        limit: 5,
        search: 'Empresa',
        estado: 'Activo',
        pais: 'España',
        comercial: '1',
      })
      .set('Cookie', 'session_token=test-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(result);

    expect(repository.listClients).toHaveBeenCalledWith(2, 5, 'Empresa', 'Activo', 'España', '1');
  });

  it('returns 500 when listing clients fails', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 1 }],
      rowCount: 1,
    } as never);

    vi.mocked(repository.listClients).mockRejectedValueOnce(
      new Error('Simulated repository failure'),
    );

    const response = await request(app)
      .get('/api/clientes')
      .set('Cookie', 'session_token=test-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Error al obtener los clientes',
    });
  });
});
