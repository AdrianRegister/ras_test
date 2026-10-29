# CSV normalization step 2

These are pure TypeScript CSV parsing and normalization helpers. They do not connect to PostgreSQL and do not insert data.

## Integration assumptions

- The CSV is semicolon-delimited and has a header row.
- `normalizeCompanyName` creates a comparison key, not the final display name. Company merging must be performed by a separate reconciliation stage.
- Country aliases include ES, PT, FR and IT because all four countries appear in the supplied CSV. The current database's `paises` table must contain IT before importing all rows.
- A phone number with an explicit `+` is retained with digits only. If the prefix is missing, the helper infers a calling code using country, email domain and legal-form hints, and the caller should log the inference.
- An unrecognized or ambiguous phone country is flagged; the caller must not insert that phone as compliant without resolving the issue.
- Invalid invoice fields remain `null` and produce structured issues. The caller should write issues to `/logs` and skip invalid invoices, while still allowing a valid client/contact to be imported.
- Money values are returned as decimal strings to avoid binary floating-point rounding.

## Tests

The tests use Node's built-in `node:test` runner. Compile the TypeScript with the project's TypeScript compiler and run the compiled test file with `node --test`. The exact command should be wired into the existing project's scripts after reviewing its `package.json` and `tsconfig.json`.
