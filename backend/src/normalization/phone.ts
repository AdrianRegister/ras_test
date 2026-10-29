import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export interface PhoneNormalizationResult {
  phone: string | null;
  inferred: boolean;
  unresolved: boolean;
}

const countryCallingCodes: Record<string, CountryCode> = {
  ES: 'ES',
  PT: 'PT',
  FR: 'FR',
  IT: 'IT',
};

function inferCountry(countryCode: string | null): CountryCode | undefined {
  if (!countryCode) return undefined;

  return countryCallingCodes[countryCode.toUpperCase()];
}

export function normalizePhone(
  value: unknown,
  _companyName: string,
  _email: string | null,
  countryCode: string | null,
): PhoneNormalizationResult {
  const original = String(value ?? '').trim();

  if (!original) {
    return { phone: null, inferred: false, unresolved: false };
  }

  const explicitInternationalPrefix = original.startsWith('+');
  const defaultCountry = explicitInternationalPrefix ? undefined : inferCountry(countryCode);

  const parsed = parsePhoneNumberFromString(original, defaultCountry);

  if (!parsed || !parsed.isValid()) {
    return {
      phone: null,
      inferred: false,
      unresolved: true,
    };
  }

  return {
    phone: parsed.number,
    inferred: !explicitInternationalPrefix,
    unresolved: false,
  };
}
