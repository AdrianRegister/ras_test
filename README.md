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
- The CSV source is UTF-8 and must not be rewritten merely to fix display encoding.
- Import validation must distinguish client errors from invoice errors.
- Duplicate invoices must not be imported twice.
- Invalid or incomplete records must be reported, not silently corrected or discarded.

### Shared TypeScript contracts and validation

- Use an npm workspaces monorepo containing `backend`, `frontend`, and `packages/shared`.
- Maintain shared API types and Zod validation schemas in `packages/shared`; do not duplicate API contracts in the backend and frontend.
- Infer TypeScript types from Zod schemas wherever practical.
- Keep database models separate from public API response types.
- Keep normalization logic modular, with unit tests for each function.
- Use Vitest as the unit testing framework.
- Preserve the existing strict TypeScript configuration where possible; adjust build settings when the workspace is established.
- Ensure the final Docker Compose setup builds the complete workspace from a fresh clone.

### Shared API contracts

- Shared schemas and TypeScript types live in `packages/shared` and are exported through `@clientes/shared`.
- Zod schemas provide runtime validation and inferred TypeScript types.
- API responses use camelCase; PostgreSQL columns retain snake_case.
- Monetary values are represented as decimal strings to avoid floating-point precision loss.
- Client detail responses include contacts, invoices and cumulative taxable billing, excluding VAT.
- Client list responses use pagination, with a default page size of 20 and a maximum of 100.
- Audit history records the entity, field, previous and new values, actor and timestamp.
- API errors use a consistent structure with a machine-readable code and message.
- `PUT` replaces the editable client fields; `PATCH` may be introduced later.
- Client and contact IDs currently use numeric API types. Confirm that PostgreSQL `BIGINT` IDs remain within JavaScript's safe integer range, or switch to string IDs before implementing endpoints.

## Decision: Client matching and missing CIFs

**Status:** Accepted

### 1. Matching clients with a missing CIF

- If a CSV row has no CIF, match it to an existing client using an exact match on `nombre_normalizado`.
- If exactly one client matches, reuse that client rather than creating a duplicate.
- Record a warning that the source row has no CIF.
- Never invent or infer a missing CIF.
- If no exact normalized-name match exists, treat the row as a potential new client, subject to the normal validation rules.

### 2. Similar company names with different legal identifiers

- Similar company names alone are not sufficient grounds for merging clients.
- Different non-empty CIFs identify separate client records, even when their company names are similar.
- Do not use fuzzy matching or automatic name-similarity matching to merge clients.
- Preserve legal suffixes such as `SL`, `SA`, `SLP` and `SRL` during normalization so distinct legal entities are not merged merely because their base names are similar.

### 3. Conflicting identifiers

- If a row has a CIF that conflicts with the CIF of a client matched by normalized name, do not merge automatically.
- Record an import incident for manual review.
- Keep the existing client data unchanged until the conflict is resolved.

### 4. Database integrity

- Use `clientes.nombre_normalizado` for exact normalized-name matching.
- Respect the unique constraint on `nombre_normalizado`.
- Do not rely on CIF uniqueness enforced by the database, because no such constraint currently exists.
- Match invoices using the client relationship and invoice number, respecting the unique constraint on `(cliente_id, numero_factura)`.

### Rationale

These rules allow missing CIFs and formatting variations to be handled without inventing data or merging unrelated legal entities. Ambiguous or conflicting records must be reported rather than silently resolved.

## Decision: CSV import, dry runs and database logging

**Status:** Accepted

### 1. Two import modes

- **Dry run:** reads and validates the CSV, applies normalization and matching rules, identifies duplicates and reports errors and warnings. It must not modify business data in the database.
- **Import:** inserts valid clients, contacts and invoices into PostgreSQL, respecting all validation, matching and duplicate-handling rules.
- Both modes must produce a clear summary of their results.

### 2. Database output logs

- Every dry-run execution must create an output log under `logs/db/`.
- Every execution that performs database inserts must also create an output log under `logs/db/`.
- Logs must be separate per execution, with filenames that distinguish the execution type and include a timestamp.
- Logs should record the source filename, execution mode, start and end times, row counts, imported records, rejected records, duplicates, warnings and errors.
- Import logs must distinguish between successful inserts and records skipped or rejected.
- Logs must not contain database passwords, connection strings with credentials, or other secrets.
- The application must report a logging failure clearly rather than silently continuing without the required audit log.

### 3. Dry-run safety

- A dry run must not insert, update or delete business records.
- A dry run must not create misleading import-history records in PostgreSQL.
- The dry-run output should make it clear which clients and invoices would be imported and which would be skipped or require review.

### 4. Import safety

- Validate records before inserting them.
- Use transactions so a failed database operation does not leave partially written related records.
- Prevent duplicate clients and invoices using the documented matching rules and database constraints.
- Record import history and incidents for actual import executions.

### 5. Log content and privacy

- Logs contain operation details and results, not SQL statements.
- Each entry should identify the operation, affected entity type, outcome and relevant record counts.
- Include validation errors, warnings, duplicate detections and database operation failures.
- Avoid logging unnecessary personal data, including contact names, email addresses and phone numbers.
- Never log credentials, passwords or connection strings containing secrets.
- Use timestamps to correlate operations within an execution.
- Logs must distinguish successful operations, skipped records, rejected records and failures.
