export type IssueSeverity = 'warning' | 'error';

export interface DataIssue {
  rowNumber: number;
  field: string;
  code: string;
  severity: IssueSeverity;
  message: string;
  originalValue: string | null;
}

export interface NormalizedInvoiceFields {
  invoiceNumber: string | null;
  invoiceDate: string | null;
  taxableBase: string | null;
  vatPercent: string | null;
}

export interface NormalizedClientFields {
  companyName: string;
  normalizedCompanyName: string;
  cif: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  salesperson: string | null;
  status: string | null;
  creationDate: string | null;
  invoice: NormalizedInvoiceFields | null;
  issues: DataIssue[];
}

export type CsvRow = Record<string, string>;
