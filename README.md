Data model: Separate clients, contacts, invoices and audit history into relational tables.
Billing calculation: Cumulative billing is the sum of invoice taxable bases, excluding VAT.
CSV handling: Normalize and validate imported data; do not silently invent missing or ambiguous values.
Authentication: JWT access tokens only; no refresh tokens. Protect all client data endpoints.
Audit integrity: Record field-level changes and the authenticated user; commit audit entries consistently with the corresponding changes.
Testing: Unit-test each developed functionality and provide one command to run the automated suite.

Proposed import policy
I'll track these as proposed decisions for your separate file:

- Normalize whitespace, capitalization where appropriate, dates, country names, VAT rates and monetary formats.
- Use a reliable company identifier, particularly the CIF, to match existing customers. Do not merge records solely because their names look similar.
- Preserve multiple contacts for one company where supported by the data.
- Reject or quarantine invalid invoices and ambiguous records for review rather than inventing corrections.
- Detect duplicate invoice numbers and avoid importing duplicates.
- Keep an import report describing accepted records, normalized values, rejected records and reasons.
- Calculate invoice totals from the taxable base and VAT, with an explicit rounding policy.

### Additional confirmed decisions — data normalization

- **Countries:** Create a `paises` table with a database ID, ISO 3166-1 alpha-2 country code and country name. Reference countries from `clientes` through a foreign key.
- **Company consolidation:** Assume similar company names in the source CSV are human errors. Consolidate each company into one client record, retaining relevant company fields, all distinct contacts and associated invoices. Document this assumption in the README.
- **Conflicting company data:** Define deterministic conflict-resolution rules and log unresolved conflicts rather than silently overwriting data.
- **Phone numbers:** Every stored phone number must include a country calling code. If absent in the source, infer the likely code using the company-name language and contact-email address as indicators. Document this assumption in the README. Flag inconclusive cases for inspection.
- **Import issue logging:** Write missing, corrupted, invalid and duplicate source-record issues to files under `/logs`. Include the source filename, row number, issue category and explanation.
- **Invalid records:** Do not silently correct invalid dates, invent missing invoice amounts or discard duplicate evidence. Record the issues in the logs and prevent invalid or duplicate invoices from being counted or inserted more than once.
- **Docker logging:** Ensure `/logs` is writable by the application and its contents persist across container recreation. Document the logging location and retention approach.

**Client status normalization:** Create an `estados` lookup table with a unique status name. Store `clientes.estado_id` as a foreign key to `estados.id`, rather than storing status as free text in the clients table. Initial statuses: `Activo` and `Inactivo`. Use the lookup table for API filtering and validation.

### Normalization libraries and code structure

- Use Day.js for date normalization, with strict format validation via `CustomParseFormat`.
- Use Zod for validating and transforming untrusted CSV rows and API inputs.
- Use libphonenumber-js for parsing, validating and formatting international telephone numbers.
- Retain the existing `csv` package for CSV parsing.
- Use small custom functions for monetary normalization, CIF formatting and company-name normalization rather than adding unnecessary dependencies.
- Do not add validator.js initially; reconsider only if specialized string-validation requirements arise.
- Keep normalization functions modular, with separate responsibilities and unit tests.
- Keep CSV parsing, validation, company consolidation, database insertion and issue reporting in separate modules.
- Normalization must report ambiguity and data-quality issues instead of silently inventing values.

### Shared TypeScript contracts and validation

- Use an npm workspaces monorepo containing `backend`, `frontend`, and `packages/shared`.
- Maintain shared API types and Zod validation schemas in `packages/shared`; do not duplicate API contracts in the backend and frontend.
- Infer TypeScript types from Zod schemas wherever practical.
- Keep database models separate from public API response types.
- Keep normalization logic modular, with unit tests for each function.
- Use Vitest as the unit testing framework.
- Preserve the existing strict TypeScript configuration where possible; adjust build settings when the workspace is established.
- Ensure the final Docker Compose setup builds the complete workspace from a fresh clone.
