export type Row = Record<string, unknown>;

/**
 * Minimal SQL interface shared by the real database (postgres.js → Supabase
 * Postgres through its pooler) and PGlite (mock mode and tests). Always use
 * $1, $2… placeholders — never interpolate values into SQL text.
 */
export interface Db {
  query<T = Row>(text: string, params?: readonly unknown[]): Promise<T[]>;
  /** Runs fn in a transaction; rolls back if it throws. */
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
}

/** Dates → ISO strings and bigint → number, so both drivers return the same shapes. */
export function normalizeRow<T>(row: Row): T {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) out[key] = normalizeValue(value);
  return out as T;
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  return value;
}

/**
 * Pass a list of ids as ONE parameter: `where id in (select jsonb_array_elements_text($1::text::jsonb)::uuid)`.
 * Always `$n::text::jsonb`, never `$n::jsonb`, for a JSON string: with `::jsonb` the real driver
 * (postgres.js) sees a jsonb parameter and JSON-encodes the string a second time — the database then
 * gets a JSON *string* ("[\"…\"]"), not a list/object. PGlite (tests, mock mode) doesn't do that,
 * so only production broke. tests/db-params.test.ts guards this.
 */
export function jsonList(values: readonly string[]): string {
  return JSON.stringify(values);
}
