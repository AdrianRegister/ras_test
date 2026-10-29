import { describe, expect, it, vi } from 'vitest';
import { resolveLookupIds } from '../../../src/import/lookup-resolver.js';
import type { PoolClient } from 'pg';

function createMockClient() {
  return {
    query: vi.fn(),
  } as unknown as PoolClient & { query: ReturnType<typeof vi.fn> };
}

describe('resolveLookupIds', () => {
  it('resolves country, status and salesperson IDs', async () => {
    const client = createMockClient();

    client.query
      .mockResolvedValueOnce({ rows: [{ id: '4' }] })
      .mockResolvedValueOnce({ rows: [{ id: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: '2' }] });

    await expect(resolveLookupIds(client, 'IT', 'Activo', 'Jordi Puig')).resolves.toEqual({
      countryId: '4',
      statusId: '1',
      salespersonId: '2',
    });

    expect(client.query).toHaveBeenCalledTimes(3);
  });

  it('allows a missing salesperson', async () => {
    const client = createMockClient();

    client.query
      .mockResolvedValueOnce({ rows: [{ id: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: '2' }] });

    await expect(resolveLookupIds(client, 'ES', 'Inactivo', null)).resolves.toEqual({
      countryId: '1',
      statusId: '2',
      salespersonId: null,
    });

    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('throws when the country does not exist', async () => {
    const client = createMockClient();
    client.query.mockResolvedValueOnce({ rows: [] });

    await expect(resolveLookupIds(client, 'XX', 'Activo', null)).rejects.toThrow(
      'Country not found: XX',
    );
  });
});
