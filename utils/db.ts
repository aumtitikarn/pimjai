import { Pool } from "pg";

/**
 * Singleton Postgres pool against the Supabase pooler. Used by trusted server
 * routes only (it connects with full DB credentials and bypasses RLS), so it
 * must never be imported into client code. Cached on globalThis so Next.js dev
 * hot-reloads don't leak connections.
 */
const globalForPg = globalThis as unknown as { __pimjaiPool?: Pool };

export function getPool(): Pool {
  if (!globalForPg.__pimjaiPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set.");

    globalForPg.__pimjaiPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 4,
    });
  }
  return globalForPg.__pimjaiPool;
}
