import { PGlite } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { mkdirSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import * as schema from "./schema";

/** The database, typed with the app's schema. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const migrationsFolder = path.join(process.cwd(), "drizzle");

/**
 * Opens the database and applies pending migrations.
 *
 * - `DATABASE_URL` set: Postgres (production).
 * - not set: an embedded PGlite database in `.data/pglite`, so development
 *   needs no server; `"memory://"` keeps it in memory (tests).
 */
export async function openDb(
  url = process.env.DATABASE_URL,
  pgliteDir = process.env.PGLITE_DIR ?? ".data/pglite",
): Promise<Db> {
  if (url) {
    const client = postgres(url, { max: 5 });
    const db = drizzlePostgres(client, { schema });
    await migratePostgres(db, { migrationsFolder });
    return db;
  }
  // PGlite creates its own folder but not the parents (`.data` on a fresh clone).
  if (!pgliteDir.includes("://")) mkdirSync(pgliteDir, { recursive: true });
  const client = new PGlite(pgliteDir);
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder });
  return db;
}

const globalDb = globalThis as unknown as { formweaveDb?: Promise<Db> };

/** The app's shared database (one per server process, kept across hot reloads). */
export function getDb(): Promise<Db> {
  globalDb.formweaveDb ??= openDb();
  return globalDb.formweaveDb;
}
