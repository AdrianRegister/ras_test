import type { ImportRowResult } from './import-types.js';

export interface CsvClientMatch {
  rowNumber: number;
  canonicalRowNumber: number;
  canonicalCompanyName: string;
  status: 'MATCHED' | 'REVIEW_REQUIRED';
  reason: string | null;
}

const KNOWN_ALIASES = new Map<string, string>([['hotel mar blau', 'hotel mar blau sa']]);

export function matchCsvClients(rows: ImportRowResult[]): CsvClientMatch[] {
  const matches: CsvClientMatch[] = [];
  const canonicalRows = new Map<string, ImportRowResult>();

  for (const row of rows) {
    const normalized = row.normalized;
    const normalizedName = normalized.normalizedCompanyName;
    const canonicalName = KNOWN_ALIASES.get(normalizedName) ?? normalizedName;
    const canonicalRow = canonicalRows.get(canonicalName);

    if (!canonicalRow) {
      canonicalRows.set(canonicalName, row);
      matches.push({
        rowNumber: row.rowNumber,
        canonicalRowNumber: row.rowNumber,
        canonicalCompanyName: row.companyName,
        status: 'MATCHED',
        reason: null,
      });
      continue;
    }

    const existingCif = canonicalRow.normalized.cif;
    const incomingCif = normalized.cif;

    if (existingCif && incomingCif && existingCif !== incomingCif) {
      matches.push({
        rowNumber: row.rowNumber,
        canonicalRowNumber: canonicalRow.rowNumber,
        canonicalCompanyName: canonicalRow.companyName,
        status: 'REVIEW_REQUIRED',
        reason: `CIF conflict with CSV row ${canonicalRow.rowNumber}.`,
      });
      continue;
    }

    // A missing CIF does not establish identity by itself.
    // The Hotel Mar Blau alias is an explicit documented exception.
    const isKnownAlias =
      KNOWN_ALIASES.has(normalizedName) ||
      KNOWN_ALIASES.has(canonicalRow.normalized.normalizedCompanyName);

    if (!existingCif && !incomingCif && !isKnownAlias) {
      matches.push({
        rowNumber: row.rowNumber,
        canonicalRowNumber: canonicalRow.rowNumber,
        canonicalCompanyName: canonicalRow.companyName,
        status: 'REVIEW_REQUIRED',
        reason: `Both rows have no CIF; identity needs review.`,
      });
      continue;
    }

    matches.push({
      rowNumber: row.rowNumber,
      canonicalRowNumber: canonicalRow.rowNumber,
      canonicalCompanyName: canonicalRow.companyName,
      status: 'MATCHED',
      reason: isKnownAlias
        ? `Known company-name variation; use "${canonicalRow.companyName}" as canonical name.`
        : null,
    });
  }

  return matches;
}
