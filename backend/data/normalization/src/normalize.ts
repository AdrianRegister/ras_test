/** Pure CSV normalization helpers for clientes_antiguos.csv.
 * No database writes occur in this module.
 */

export type IssueSeverity = 'warning' | 'error';

export interface DataIssue {
  rowNumber: number;
  field: string;
  code: string;
  severity: IssueSeverity;
  message: string;
  originalValue: string;
}

export interface NormalizedInvoiceFields {
  invoiceNumber: string | null;
  invoiceDate: string | null; // ISO YYYY-MM-DD
  taxableBase: string | null; // exact decimal string, e.g. "1875.60"
  vatPercent: string | null; // percentage, e.g. "21.00"
}

export interface NormalizedClientFields {
  companyName: string;
  normalizedCompanyName: string;
  cif: string | null;
  contactName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  salesperson: string | null;
  status: 'Activo' | 'Inactivo' | null;
  creationDate: string | null;
  invoice: NormalizedInvoiceFields | null;
  issues: DataIssue[];
}

export type CsvRow = Record<string, string>;

const COUNTRY_ALIASES: Record<string, { code: string; name: string }> = {
  'es': { code: 'ES', name: 'España' },
  'espana': { code: 'ES', name: 'España' },
  'spain': { code: 'ES', name: 'España' },
  'pt': { code: 'PT', name: 'Portugal' },
  'portugal': { code: 'PT', name: 'Portugal' },
  'fr': { code: 'FR', name: 'Francia' },
  'francia': { code: 'FR', name: 'Francia' },
  'france': { code: 'FR', name: 'Francia' },
  'it': { code: 'IT', name: 'Italia' },
  'italia': { code: 'IT', name: 'Italia' },
  'italy': { code: 'IT', name: 'Italia' },
};

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function cleanText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeCompanyName(value: unknown): string {
  const name = cleanText(value);
  return stripDiacritics(name)
    .toLocaleLowerCase('es-ES')
    .replace(/[.,;:'"`´]/g, '')
    .replace(/\bslp\b/g, ' slp ')
    .replace(/\bsrl\b/g, ' srl ')
    .replace(/\bsar l\b/g, ' sarl ')
    .replace(/\blda\b/g, ' lda ')
    .replace(/\bsa\b/g, ' sa ')
    .replace(/\bsl\b/g, ' sl ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeCif(value: unknown): string | null {
  const cleaned = cleanText(value).toUpperCase().replace(/[\s.-]+/g, '');
  return cleaned || null;
}

export function normalizeEmail(value: unknown): string | null {
  const cleaned = cleanText(value).toLowerCase();
  return cleaned || null;
}

export function normalizeCountry(value: unknown): { code: string; name: string } | null {
  const key = stripDiacritics(cleanText(value)).toLowerCase().replace(/[^a-z]/g, '');
  return COUNTRY_ALIASES[key] ?? null;
}

function inferCountryCode(companyName: string, email: string | null, countryCode: string | null): string | null {
  if (countryCode) return countryCode;
  const normalizedCompany = stripDiacritics(companyName).toLowerCase();
  const domain = (email?.split('@').pop() ?? '').toLowerCase();

  // Explicitly limited inference rules. These are heuristics, not proof of location.
  if (domain.endsWith('.es') || /\b(sl|slp|sa)\b/.test(normalizedCompany)) return '34';
  if (domain.endsWith('.pt') || /\b(lda)\b/.test(normalizedCompany)) return '351';
  if (domain.endsWith('.fr') || /\b(sarl)\b/.test(normalizedCompany)) return '33';
  if (domain.endsWith('.it') || /\b(srl)\b/.test(normalizedCompany)) return '39';
  return null;
}

export function normalizePhone(
  value: unknown,
  companyName: string,
  email: string | null,
  countryCode: string | null,
): { phone: string | null; inferred: boolean; unresolved: boolean } {
  const original = cleanText(value);
  if (!original) return { phone: null, inferred: false, unresolved: false };

  const digits = original.replace(/\D/g, '');
  if (!digits) return { phone: null, inferred: false, unresolved: true };

  // A leading + means the source already explicitly supplied an international prefix.
  if (original.startsWith('+')) {
    return { phone: `+${digits}`, inferred: false, unresolved: false };
  }

  const callingCode = inferCountryCode(companyName, email, countryCode);
  if (!callingCode) return { phone: digits, inferred: false, unresolved: true };

  // Avoid duplicating a calling code if the source omitted only the plus sign.
  if (digits.startsWith(callingCode)) {
    return { phone: `+${digits}`, inferred: true, unresolved: false };
  }
  return { phone: `+${callingCode}${digits}`, inferred: true, unresolved: false };
}

export function normalizeDate(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) return null;

  let year: number;
  let month: number;
  let day: number;
  let match: RegExpMatchArray | null;

  if ((match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/))) {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
    if (year < 100) year += year <= 49 ? 2000 : 1900;
  } else if ((match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/** Parse European/Spanish decimal formats without using floating-point arithmetic. */
export function normalizeMoney(value: unknown): string | null {
  let text = cleanText(value).replace(/€/g, '').replace(/\s/g, '');
  if (!text) return null;
  text = text.replace(/^[€]|[€]$/g, '');
  if (!/^[-+]?\d[\d.,]*$/.test(text)) return null;

  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  let integerPart = text;
  let fractionPart = '';

  if (comma >= 0 && dot >= 0) {
    const decimalSeparator = comma > dot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    if (text.indexOf(decimalSeparator) !== text.lastIndexOf(decimalSeparator)) return null;
    const parts = text.split(decimalSeparator);
    if (parts.length !== 2 || !/^\d{1,2}$/.test(parts[1])) return null;
    integerPart = parts[0].replaceAll(thousandsSeparator, '');
    fractionPart = parts[1];
  } else if (comma >= 0 || dot >= 0) {
    const separator = comma >= 0 ? ',' : '.';
    const parts = text.split(separator);
    if (parts.length > 2) {
      // Repeated separators are treated as thousands separators only when groups are valid.
      if (!/^[-+]?\d{1,3}(?:[.,]\d{3})+$/.test(text)) return null;
      integerPart = text.replace(/[.,]/g, '');
    } else if (parts.length === 2) {
      if (parts[1].length === 3 && parts[0].replace(/^[-+]/, '').length <= 3) {
        // In this source, "1.250" means 1250, not 1.25.
        integerPart = parts[0] + parts[1];
      } else {
        if (parts[1].length < 1 || parts[1].length > 2) return null;
        integerPart = parts[0];
        fractionPart = parts[1];
      }
    }
  }

  if (!/^[-+]?\d+$/.test(integerPart)) return null;
  const sign = integerPart.startsWith('-') ? '-' : '';
  const whole = integerPart.replace(/^[-+]/, '').replace(/^0+(?=\d)/, '');
  const fraction = (fractionPart + '00').slice(0, 2);
  return `${sign}${whole}.${fraction}`;
}

export function normalizeVat(value: unknown): string | null {
  const text = cleanText(value).replace(/%/g, '').replace(',', '.');
  if (!text) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0 || number > 100) return null;
  return number.toFixed(2);
}

export function normalizeStatus(value: unknown): 'Activo' | 'Inactivo' | null {
  const text = cleanText(value).toLowerCase();
  if (text === 'activo' || text === 'activa') return 'Activo';
  if (text === 'inactivo' || text === 'inactiva') return 'Inactivo';
  return null;
}

/** Parse a semicolon-delimited CSV, including quoted fields and escaped double quotes. */
export function parseSemicolonCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ';') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (!(row.length === 1 && row[0] === '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

export function csvRowsToObjects(input: string): Array<{ rowNumber: number; row: CsvRow }> {
  const parsed = parseSemicolonCsv(input.replace(/^\uFEFF/, ''));
  if (parsed.length === 0) return [];
  const headers = parsed[0].map((header) => cleanText(header).toLowerCase());
  return parsed.slice(1).map((values, index) => {
    const row: CsvRow = {};
    headers.forEach((header, column) => { row[header] = values[column] ?? ''; });
    return { rowNumber: index + 2, row };
  });
}

export function normalizeCsvRow(rowNumber: number, row: CsvRow): NormalizedClientFields {
  const issues: DataIssue[] = [];
  const addIssue = (field: string, code: string, severity: IssueSeverity, message: string, originalValue: unknown) => {
    issues.push({ rowNumber, field, code, severity, message, originalValue: String(originalValue ?? '') });
  };

  const companyName = cleanText(row.empresa);
  const normalizedCompanyName = normalizeCompanyName(companyName);
  if (!companyName) addIssue('empresa', 'MISSING_COMPANY', 'error', 'Company name is missing.', row.empresa);

  const cif = normalizeCif(row.cif);
  const email = normalizeEmail(row.email);
  const country = normalizeCountry(row.pais);
  if (!country) addIssue('pais', 'UNKNOWN_COUNTRY', 'error', 'Country could not be normalized to a supported ISO code.', row.pais);

  const phoneResult = normalizePhone(row.telefono, companyName, email, country?.code ?? null);
  if (phoneResult.unresolved) {
    addIssue('telefono', 'PHONE_COUNTRY_CODE_UNRESOLVED', 'warning', 'Phone number has no explicit international prefix and the country calling code could not be inferred confidently.', row.telefono);
  } else if (phoneResult.inferred) {
    addIssue('telefono', 'PHONE_COUNTRY_CODE_INFERRED', 'warning', 'International calling code was inferred from company/country/email indicators.', row.telefono);
  }

  const status = normalizeStatus(row.estado);
  if (!status) addIssue('estado', 'UNKNOWN_STATUS', 'error', 'Status must be Activo or Inactivo.', row.estado);

  const creationDate = normalizeDate(row.fecha_alta);
  if (cleanText(row.fecha_alta) && !creationDate) {
    addIssue('fecha_alta', 'INVALID_CLIENT_DATE', 'error', 'Client creation date is invalid or unsupported.', row.fecha_alta);
  }

  const invoiceNumber = cleanText(row.factura) || null;
  const invoiceDateRaw = cleanText(row.fecha_factura);
  const baseRaw = cleanText(row.base_imponible);
  const vatRaw = cleanText(row.iva);
  const invoiceFieldsPresent = Boolean(invoiceNumber || invoiceDateRaw || baseRaw || vatRaw);
  let invoice: NormalizedInvoiceFields | null = null;

  if (invoiceFieldsPresent) {
    const invoiceDate = normalizeDate(invoiceDateRaw);
    const taxableBase = normalizeMoney(baseRaw);
    const vatPercent = normalizeVat(vatRaw);
    if (!invoiceNumber) addIssue('factura', 'MISSING_INVOICE_NUMBER', 'error', 'Invoice data exists but invoice number is missing.', row.factura);
    if (!invoiceDate) addIssue('fecha_factura', 'INVALID_INVOICE_DATE', 'error', 'Invoice date is missing, invalid or unsupported.', row.fecha_factura);
    if (taxableBase === null) addIssue('base_imponible', 'INVALID_OR_MISSING_TAXABLE_BASE', 'error', 'Invoice taxable base is missing or invalid.', row.base_imponible);
    if (vatPercent === null) addIssue('iva', 'INVALID_OR_MISSING_VAT', 'error', 'Invoice VAT rate is missing or invalid.', row.iva);
    invoice = { invoiceNumber, invoiceDate, taxableBase, vatPercent };
  }

  return {
    companyName,
    normalizedCompanyName,
    cif,
    contactName: cleanText(row.contacto),
    email,
    phone: phoneResult.phone,
    address: cleanText(row.direccion) || null,
    postalCode: cleanText(row.cp) || null,
    city: cleanText(row.ciudad) || null,
    countryCode: country?.code ?? null,
    salesperson: cleanText(row.comercial) || null,
    status,
    creationDate,
    invoice,
    issues,
  };
}
