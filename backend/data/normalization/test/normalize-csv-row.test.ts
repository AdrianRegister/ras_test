import { describe, expect, it } from 'vitest';
import { normalizeCsvRow } from '../src/normalize-csv-row.js';
import type { CsvRow } from '../src/types.js';

function makeRow(overrides: Partial<CsvRow> = {}): CsvRow {
  return {
    empresa: 'Construcciones Ebro SL',
    cif: 'B12345678',
    contacto: 'Ana García',
    email: 'ana@example.es',
    telefono: '+34 612 345 678',
    direccion: 'Calle Mayor 10',
    cp: '08001',
    ciudad: 'Barcelona',
    pais: 'España',
    comercial: 'Elena Sanz',
    estado: 'Activo',
    fecha_alta: '15/01/2026',
    factura: 'F-2026-0101',
    fecha_factura: '20/01/2026',
    base_imponible: '1.250,50',
    iva: '21%',
    ...overrides,
  };
}

describe('normalizeCsvRow', () => {
  it('normalizes a valid client and invoice', () => {
    const result = normalizeCsvRow(2, makeRow());

    expect(result.companyName).toBe('Construcciones Ebro SL');
    expect(result.normalizedCompanyName).toBe('construcciones ebro sl');
    expect(result.cif).toBe('B12345678');
    expect(result.email).toBe('ana@example.es');
    expect(result.countryCode).toBe('ES');
    expect(result.status).toBe('Activo');
    expect(result.creationDate).toBe('2026-01-15');

    expect(result.invoice).toEqual({
      invoiceNumber: 'F-2026-0101',
      invoiceDate: '2026-01-20',
      taxableBase: '1250.50',
      vatPercent: '21.00',
    });

    expect(result.issues).toEqual([]);
  });

  it('preserves the client when no invoice values are supplied', () => {
    const result = normalizeCsvRow(
      3,
      makeRow({
        factura: '',
        fecha_factura: '',
        base_imponible: '',
        iva: '',
      }),
    );

    expect(result.companyName).toBe('Construcciones Ebro SL');
    expect(result.invoice).toBeNull();
    expect(result.issues).toEqual([]);
  });

  it('reports a missing company name', () => {
    const result = normalizeCsvRow(4, makeRow({ empresa: '' }));

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        rowNumber: 4,
        field: 'empresa',
        code: 'MISSING_COMPANY',
        severity: 'error',
      }),
    );
  });

  it('reports an unknown country and status', () => {
    const result = normalizeCsvRow(5, makeRow({ pais: 'Germany', estado: 'Pendiente' }));

    expect(result.countryCode).toBeNull();
    expect(result.status).toBeNull();

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'pais',
          code: 'UNKNOWN_COUNTRY',
          severity: 'error',
        }),
        expect.objectContaining({
          field: 'estado',
          code: 'UNKNOWN_STATUS',
          severity: 'error',
        }),
      ]),
    );
  });

  it('reports an invalid client creation date', () => {
    const result = normalizeCsvRow(6, makeRow({ fecha_alta: '31/09/2026' }));

    expect(result.creationDate).toBeNull();
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: 'fecha_alta',
        code: 'INVALID_CREATION_DATE',
        severity: 'error',
      }),
    );
  });

  it('reports invalid invoice fields without removing the client', () => {
    const result = normalizeCsvRow(
      7,
      makeRow({
        fecha_factura: '31/09/2026',
        base_imponible: '',
        iva: '150%',
      }),
    );

    expect(result.companyName).toBe('Construcciones Ebro SL');
    expect(result.invoice).not.toBeNull();

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'fecha_factura',
          code: 'INVALID_INVOICE_DATE',
          severity: 'error',
        }),
        expect.objectContaining({
          field: 'base_imponible',
          code: 'INVALID_TAXABLE_BASE',
          severity: 'error',
        }),
        expect.objectContaining({
          field: 'iva',
          code: 'INVALID_VAT',
          severity: 'error',
        }),
      ]),
    );
  });

  it('reports an invalid email address', () => {
    const result = normalizeCsvRow(8, makeRow({ email: 'not-an-email' }));

    expect(result.email).toBe('not-an-email');
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: 'email',
        code: 'INVALID_EMAIL',
        severity: 'error',
      }),
    );
  });

  it('preserves a missing CIF instead of inventing one', () => {
    const result = normalizeCsvRow(9, makeRow({ cif: '' }));

    expect(result.cif).toBeNull();
  });

  it('preserves the source row number in issues', () => {
    const result = normalizeCsvRow(17, makeRow({ empresa: '', estado: 'Unknown' }));

    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.every((entry) => entry.rowNumber === 17)).toBe(true);
  });

  it('keeps a client when its invoice number is missing', () => {
    const result = normalizeCsvRow(10, makeRow({ factura: '' }));

    expect(result.companyName).toBe('Construcciones Ebro SL');
    expect(result.invoice).not.toBeNull();
    expect(result.invoice?.invoiceNumber).toBeNull();

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: 'factura',
        code: 'MISSING_INVOICE_NUMBER',
        severity: 'error',
      }),
    );
  });

  it('does not create an invoice when every invoice field is empty', () => {
    const result = normalizeCsvRow(
      11,
      makeRow({
        factura: '',
        fecha_factura: '',
        base_imponible: '',
        iva: '',
      }),
    );

    expect(result.invoice).toBeNull();
    expect(
      result.issues.filter((entry) =>
        [
          'MISSING_INVOICE_NUMBER',
          'INVALID_INVOICE_DATE',
          'INVALID_TAXABLE_BASE',
          'INVALID_VAT',
        ].includes(entry.code),
      ),
    ).toEqual([]);
  });

  it('preserves an invalid invoice date as an issue without rejecting the client data', () => {
    const result = normalizeCsvRow(12, makeRow({ fecha_factura: '31/09/2026' }));

    expect(result.companyName).toBe('Construcciones Ebro SL');
    expect(result.invoice?.invoiceDate).toBeNull();
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        field: 'fecha_factura',
        code: 'INVALID_INVOICE_DATE',
        severity: 'error',
      }),
    );
  });
});
