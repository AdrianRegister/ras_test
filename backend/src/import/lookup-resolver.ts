import type { PoolClient } from 'pg';

export interface LookupIds {
  countryId: string;
  statusId: string;
  salespersonId: string | null;
}

export async function resolveLookupIds(
  client: PoolClient,
  countryCode: string,
  status: string,
  salesperson: string | null,
): Promise<LookupIds> {
  const countryResult = await client.query<{ id: string }>(
    'SELECT id FROM paises WHERE codigo = $1',
    [countryCode],
  );

  if (countryResult.rows.length !== 1) {
    throw new Error(`Country not found: ${countryCode}`);
  }

  const statusResult = await client.query<{ id: string }>(
    'SELECT id FROM estados WHERE nombre = $1',
    [status],
  );

  if (statusResult.rows.length !== 1) {
    throw new Error(`Status not found: ${status}`);
  }

  let salespersonId: string | null = null;

  if (salesperson) {
    const salespersonResult = await client.query<{ id: string }>(
      'SELECT id FROM comerciales WHERE nombre = $1',
      [salesperson],
    );

    if (salespersonResult.rows.length !== 1) {
      throw new Error(`Salesperson not found: ${salesperson}`);
    }

    salespersonId = salespersonResult.rows[0].id;
  }

  return {
    countryId: countryResult.rows[0].id,
    statusId: statusResult.rows[0].id,
    salespersonId,
  };
}
