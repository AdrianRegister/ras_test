import test from 'node:test';
import assert from 'node:assert/strict';
import {
  csvRowsToObjects,
  normalizeCompanyName,
  normalizeCif,
  normalizeCountry,
  normalizeDate,
  normalizeMoney,
  normalizePhone,
  normalizeStatus,
  normalizeVat,
  normalizeCsvRow,
} from '../src/normalize.js';

test('normalizes company-name variants for consolidation', () => {
  assert.equal(normalizeCompanyName('Construcciones Ebro SL'), normalizeCompanyName('CONSTRUCCIONES EBRO, S.L.'));
});

test('normalizes CIF punctuation and casing', () => {
  assert.equal(normalizeCif('b-50123456'), 'B50123456');
});

test('normalizes country aliases including Italy', () => {
  assert.equal(normalizeCountry('ESPAÑA')?.code, 'ES');
  assert.equal(normalizeCountry('PT')?.code, 'PT');
  assert.equal(normalizeCountry('Italy')?.code, 'IT');
});

test('parses supported dates and rejects impossible dates', () => {
  assert.equal(normalizeDate('5/3/25'), '2025-03-05');
  assert.equal(normalizeDate('2025-01-14'), '2025-01-14');
  assert.equal(normalizeDate('31/09/2026'), null);
});

test('parses source monetary formats exactly', () => {
  assert.equal(normalizeMoney('1.250'), '1250.00');
  assert.equal(normalizeMoney('1.875,60'), '1875.60');
  assert.equal(normalizeMoney('640.5'), '640.50');
  assert.equal(normalizeMoney('980,40 €'), '980.40');
  assert.equal(normalizeMoney('2.300'), '2300.00');
  assert.equal(normalizeMoney(''), null);
});

test('normalizes VAT representations', () => {
  assert.equal(normalizeVat('21%'), '21.00');
  assert.equal(normalizeVat('21'), '21.00');
  assert.equal(normalizeVat('0%'), '0.00');
  assert.equal(normalizeVat('101%'), null);
});

test('adds inferred Spanish calling code and flags inference', () => {
  const result = normalizePhone('91 555 12 34', 'Clínica Dental Sonrisa SLP', 'lucia@clinicasonrisa.es', 'ES');
  assert.deepEqual(result, { phone: '+34915551234', inferred: true, unresolved: false });
});

test('preserves explicit international phone code', () => {
  const result = normalizePhone('+39 02 1234567', 'Associazione Culturale Brera', 'giulia@brera-cultura.it', 'IT');
  assert.deepEqual(result, { phone: '+39021234567', inferred: false, unresolved: false });
});

test('normalizes status values', () => {
  assert.equal(normalizeStatus('ACTIVO'), 'Activo');
  assert.equal(normalizeStatus('Inactivo'), 'Inactivo');
  assert.equal(normalizeStatus('unknown'), null);
});

test('CSV parser preserves quoted semicolons and escaped quotes', () => {
  const rows = csvRowsToObjects('empresa;contacto\n"Empresa; Dos";"Ana ""Anita"" Pérez"\n');
  assert.equal(rows[0].row.empresa, 'Empresa; Dos');
  assert.equal(rows[0].row.contacto, 'Ana "Anita" Pérez');
  assert.equal(rows[0].rowNumber, 2);
});

test('normalization flags the invalid invoice date and missing taxable base', () => {
  const result = normalizeCsvRow(8, {
    empresa: 'Vinhos do Porto Lda', cif: 'PT509876543', contacto: 'João Silva',
    email: 'joao.silva@vinhosdoporto.pt', telefone: '+351 912 345 678',
    direccion: 'Rua de Santa Catarina, 100', cp: '4000-447', ciudad: 'Porto',
    pais: 'Portugal', comercial: 'Carmen Vega', estado: 'Activo',
    fecha_alta: '18/11/2025', factura: 'F-2026-0108', fecha_factura: '31/09/2026',
    base_imponible: '450,00', iva: '0%',
  });
  assert.ok(result.issues.some((issue) => issue.code === 'INVALID_INVOICE_DATE'));
  assert.equal(result.invoice?.invoiceDate, null);
});
