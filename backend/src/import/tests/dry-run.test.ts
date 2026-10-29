import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readCsv: vi.fn(),
  writeImportLog: vi.fn(),
}));

vi.mock('../csv-reader.js', () => ({
  readCsv: mocks.readCsv,
}));

vi.mock('../import-logger.js', () => ({
  writeImportLog: mocks.writeImportLog,
}));

import { runDryRun } from '../dry-run.js';

function makeCsvRow(overrides: Record<string, string> = {}) {
  return {
    empresa: 'Construcciones Ebro SL',
    cif: 'B50123456',
    contacto: 'Ana García',
    email: 'ana@example.com',
    telefono: '+34912345678',
    direccion: 'Calle Mayor 1',
    cp: '28001',
    ciudad: 'Madrid',
    pais: 'ES',
    comercial: 'Elena Sanz',
    estado: 'Activo',
    fecha_alta: '01/01/2026',
    factura: 'F-2026-0101',
    fecha_factura: '15/01/2026',
    base_imponible: '100,00',
    iva: '21',
    ...overrides,
  };
}

describe('runDryRun', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.readCsv.mockResolvedValue([makeCsvRow()]);
    mocks.writeImportLog.mockResolvedValue('logs/db/dry-run-test.log');
  });

  it('normalizes rows, returns a summary and writes a dry-run log', async () => {
    const result = await runDryRun('clientes_antiguos.csv');

    expect(mocks.readCsv).toHaveBeenCalledOnce();
    expect(mocks.writeImportLog).toHaveBeenCalledOnce();

    expect(mocks.writeImportLog).toHaveBeenCalledWith(
      'dry-run',
      expect.objectContaining({
        totalRows: 1,
        duplicateRows: 0,
      }),
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].companyName).toBe('Construcciones Ebro SL');
    expect(result.summary.totalRows).toBe(1);
    expect(result.logPath).toBe('logs/db/dry-run-test.log');
  });

  it('marks a repeated invoice number as duplicate', async () => {
    mocks.readCsv.mockResolvedValue([
      makeCsvRow({ factura: 'F-2026-0115' }),
      makeCsvRow({ factura: 'F-2026-0115' }),
    ]);

    const result = await runDryRun('clientes_antiguos.csv');

    expect(result.rows).toHaveLength(2);
    expect(result.rows[1].status).toBe('DUPLICATE');
    expect(result.rows[1].reasons).toContain('Invoice F-2026-0115 also appears on CSV row 2.');
    expect(result.summary.duplicateRows).toBe(1);
  });

  it('does not mark rows with no invoice as duplicates', async () => {
    mocks.readCsv.mockResolvedValue([
      makeCsvRow({
        factura: '',
        fecha_factura: '',
        base_imponible: '',
        iva: '',
      }),
      makeCsvRow({
        factura: '',
        fecha_factura: '',
        base_imponible: '',
        iva: '',
      }),
    ]);

    const result = await runDryRun('clientes_antiguos.csv');

    expect(result.rows).toHaveLength(2);
    expect(result.rows.every((row) => row.status !== 'DUPLICATE')).toBe(true);
    expect(result.summary.duplicateRows).toBe(0);
  });

  it('propagates CSV reading errors', async () => {
    mocks.readCsv.mockRejectedValue(new Error('CSV file not found'));

    await expect(runDryRun('missing.csv')).rejects.toThrow('CSV file not found');

    expect(mocks.writeImportLog).not.toHaveBeenCalled();
  });
});
