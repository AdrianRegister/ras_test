import type { CsvRow, DataIssue, NormalizedClientFields } from './types.js';
import { normalizeCompanyName } from './company.js';
import { normalizeCountry } from './country.js';
import { normalizeDate } from './date.js';
import { normalizeCif, normalizeEmail } from './identifiers.js';
import { normalizeMoney } from './money.js';
import { normalizePhone } from './phone.js';
import { normalizeStatus } from './status.js';
import { cleanText } from './text.js';

function nullableText(value: unknown): string | null {
  const text = cleanText(value);
  return text || null;
}

function issue(
  rowNumber: number,
  field: string,
  code: string,
  severity: 'warning' | 'error',
  message: string,
  originalValue: unknown,
): DataIssue {
  return {
    rowNumber,
    field,
    code,
    severity,
    message,
    originalValue:
      originalValue === null || originalValue === undefined ? null : String(originalValue),
  };
}

function isValidEmail(email: string | null): boolean {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeCsvRow(rowNumber: number, row: CsvRow): NormalizedClientFields {
  const issues: DataIssue[] = [];

  const companyName = cleanText(row.empresa);
  const normalizedCompanyName = normalizeCompanyName(row.empresa);
  const cif = normalizeCif(row.cif);
  const contactName = nullableText(row.contacto);
  const email = normalizeEmail(row.email);
  const address = nullableText(row.direccion);
  const postalCode = nullableText(row.cp);
  const city = nullableText(row.ciudad);
  const countryCode = normalizeCountry(row.pais);
  const salesperson = nullableText(row.comercial);
  const status = normalizeStatus(row.estado);
  const creationDate = normalizeDate(row.fecha_alta);

  if (!companyName) {
    issues.push(
      issue(
        rowNumber,
        'empresa',
        'MISSING_COMPANY',
        'error',
        'Company name is required.',
        row.empresa,
      ),
    );
  }

  if (!countryCode) {
    issues.push(
      issue(
        rowNumber,
        'pais',
        'UNKNOWN_COUNTRY',
        'error',
        'Country is missing or unrecognized.',
        row.pais,
      ),
    );
  }

  if (email && !isValidEmail(email)) {
    issues.push(
      issue(rowNumber, 'email', 'INVALID_EMAIL', 'error', 'Email address is invalid.', row.email),
    );
  }

  if (!status) {
    issues.push(
      issue(
        rowNumber,
        'estado',
        'UNKNOWN_STATUS',
        'error',
        'Status is missing or unrecognized.',
        row.estado,
      ),
    );
  }

  if (row.fecha_alta?.trim() && !creationDate) {
    issues.push(
      issue(
        rowNumber,
        'fecha_alta',
        'INVALID_CREATION_DATE',
        'error',
        'Client creation date is invalid.',
        row.fecha_alta,
      ),
    );
  }

  const phoneResult = normalizePhone(row.telefono, companyName, email, countryCode);

  if (phoneResult.unresolved) {
    issues.push(
      issue(
        rowNumber,
        'telefono',
        'UNRESOLVED_PHONE',
        'warning',
        'Phone number could not be normalized.',
        row.telefono,
      ),
    );
  } else if (phoneResult.inferred) {
    issues.push(
      issue(
        rowNumber,
        'telefono',
        'INFERRED_PHONE_COUNTRY',
        'warning',
        'Phone country was inferred during normalization.',
        row.telefono,
      ),
    );
  }

  const invoiceNumber = nullableText(row.factura);
  const invoiceDateInput = nullableText(row.fecha_factura);
  const taxableBaseInput = nullableText(row.base_imponible);
  const vatInput = nullableText(row.iva);

  const hasAnyInvoiceValue = Boolean(
    invoiceNumber || invoiceDateInput || taxableBaseInput || vatInput,
  );

  let invoice: NormalizedClientFields['invoice'] = null;

  if (hasAnyInvoiceValue) {
    const invoiceDate = normalizeDate(invoiceDateInput);
    const taxableBase = normalizeMoney(taxableBaseInput);
    const vatPercent = normalizeMoney(vatInput);

    if (!invoiceNumber) {
      issues.push(
        issue(
          rowNumber,
          'factura',
          'MISSING_INVOICE_NUMBER',
          'error',
          'Invoice number is missing.',
          row.factura,
        ),
      );
    }

    if (!invoiceDate) {
      issues.push(
        issue(
          rowNumber,
          'fecha_factura',
          'INVALID_INVOICE_DATE',
          'error',
          'Invoice date is missing or invalid.',
          row.fecha_factura,
        ),
      );
    }

    if (!taxableBase) {
      issues.push(
        issue(
          rowNumber,
          'base_imponible',
          'INVALID_TAXABLE_BASE',
          'error',
          'Taxable base is missing or invalid.',
          row.base_imponible,
        ),
      );
    }

    const vatNumber = vatInput?.replace('%', '').trim();
    const normalizedVat = vatNumber ? normalizeMoney(vatNumber) : null;
    const vatValue = normalizedVat === null ? null : Number(normalizedVat);

    if (vatValue === null || !Number.isFinite(vatValue) || vatValue < 0 || vatValue > 100) {
      issues.push(
        issue(
          rowNumber,
          'iva',
          'INVALID_VAT',
          'error',
          'VAT percentage is missing or outside the range 0–100.',
          row.iva,
        ),
      );
    }

    invoice = {
      invoiceNumber,
      invoiceDate,
      taxableBase,
      vatPercent: normalizedVat === null ? null : Number(normalizedVat).toFixed(2),
    };
  }

  return {
    companyName,
    normalizedCompanyName,
    cif,
    contactName,
    email,
    phone: phoneResult.phone,
    address,
    postalCode,
    city,
    countryCode,
    salesperson,
    status,
    creationDate,
    invoice,
    issues,
  };
}
