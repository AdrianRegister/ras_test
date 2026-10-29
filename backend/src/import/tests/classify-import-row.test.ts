import { describe, expect, it } from 'vitest';
import { classifyImportRow } from '../../../src/import/classify-import-row.js';
import type { NormalizedClientFields } from '../import-types.ts';

function makeNormalized(overrides: Partial<NormalizedClientFields> = {}): NormalizedClientFields {
  return {
    companyName: 'Construcciones Ebro SL',
    normalizedCompanyName: 'construcciones ebro sl',
    cif: 'B50123456',
    contactName: 'Ana García',
    email: 'ana@example.com',
    phone: '+34900111222',
    address: 'Calle Mayor 1',
    postalCode: '08001',
    city: 'Barcelona',
    countryCode: 'ES',
    salesperson: 'Elena Sanz',
    status: 'Activo',
    creationDate: '2026-01-10',
    invoice: {
      invoiceNumber: 'F-2026-0101',
      invoiceDate: '2026-01-20',
      taxableBase: '1250.50',
      vatPercent: '21.00',
    },
    issues: [],
    ...overrides,
  };
}

describe('classifyImportRow', () => {
  it('flags a valid row for database review', () => {
    const result = classifyImportRow(2, makeNormalized());

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.reasons).toEqual([]);
    expect(result.invoiceNumber).toBe('F-2026-0101');
  });

  it('rejects a row with a client-level error', () => {
    const normalized = makeNormalized({
      issues: [
        {
          rowNumber: 3,
          field: 'pais',
          code: 'UNKNOWN_COUNTRY',
          severity: 'error',
          message: 'Country is missing or unrecognized.',
          originalValue: 'Unknown',
        },
      ],
    });

    const result = classifyImportRow(3, normalized);

    expect(result.status).toBe('REJECTED');
    expect(result.reasons).toContain('pais: Country is missing or unrecognized.');
  });

  it('keeps the client partially valid when its invoice is invalid', () => {
    const normalized = makeNormalized({
      invoice: {
        invoiceNumber: 'F-2026-0101',
        invoiceDate: null,
        taxableBase: '1250.50',
        vatPercent: '21.00',
      },
      issues: [
        {
          rowNumber: 4,
          field: 'fecha_factura',
          code: 'INVALID_INVOICE_DATE',
          severity: 'error',
          message: 'Invoice date is missing or invalid.',
          originalValue: '31/09/2026',
        },
      ],
    });

    const result = classifyImportRow(4, normalized);

    expect(result.status).toBe('PARTIALLY_VALID');
    expect(result.reasons).toContain('fecha_factura: Invoice date is missing or invalid.');
  });

  it('preserves a client with no invoice and no issues for review', () => {
    const result = classifyImportRow(5, makeNormalized({ invoice: null }));

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.invoiceNumber).toBeNull();
  });
});
