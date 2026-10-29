import { describe, expect, it } from 'vitest';
import { matchCsvClients } from '../match-csv-clients.js';
import type { ImportRowResult } from '../import-types.js';

function makeRow(
  rowNumber: number,
  companyName: string,
  normalizedCompanyName: string,
  cif: string | null,
): ImportRowResult {
  return {
    rowNumber,
    status: 'REVIEW_REQUIRED',
    companyName,
    invoiceNumber: null,
    reasons: [],
    issues: [],
    normalized: {
      companyName,
      normalizedCompanyName,
      cif,
      contactName: null,
      email: null,
      phone: null,
      address: null,
      postalCode: null,
      city: null,
      countryCode: 'ES',
      salesperson: null,
      status: 'Activo',
      creationDate: null,
      invoice: null,
      issues: [],
    },
  };
}

describe('matchCsvClients', () => {
  it('matches equivalent company names with the same normalized CIF', () => {
    const result = matchCsvClients([
      makeRow(2, 'Construcciones Ebro SL', 'construcciones ebro sl', 'B50123456'),
      makeRow(10, 'CONSTRUCCIONES EBRO, S.L.', 'construcciones ebro sl', 'B50123456'),
    ]);

    expect(result[1]).toMatchObject({
      rowNumber: 10,
      canonicalRowNumber: 2,
      status: 'MATCHED',
    });
  });

  it('flags conflicting CIFs for review', () => {
    const result = matchCsvClients([
      makeRow(2, 'Construcciones Ebro SL', 'construcciones ebro sl', 'B50123456'),
      makeRow(3, 'Construcciones Ebro SL', 'construcciones ebro sl', 'B99999999'),
    ]);

    expect(result[1].status).toBe('REVIEW_REQUIRED');
    expect(result[1].reason).toContain('CIF conflict');
  });

  it('matches the documented Hotel Mar Blau alias to the canonical company', () => {
    const result = matchCsvClients([
      makeRow(5, 'Hotel Mar Blau SA', 'hotel mar blau sa', 'A07123987'),
      makeRow(16, 'Hotel Mar Blau', 'hotel mar blau', null),
    ]);

    expect(result[1]).toMatchObject({
      rowNumber: 16,
      canonicalRowNumber: 5,
      canonicalCompanyName: 'Hotel Mar Blau SA',
      status: 'MATCHED',
    });
    expect(result[1].reason).toContain('Known company-name variation');
  });

  it('does not merge unrelated names just because their CIF is missing', () => {
    const result = matchCsvClients([
      makeRow(2, 'Company Alpha', 'company alpha', null),
      makeRow(3, 'Company Beta', 'company beta', null),
    ]);

    expect(result[1]).toMatchObject({
      rowNumber: 3,
      canonicalRowNumber: 3,
      status: 'MATCHED',
    });
  });
});
