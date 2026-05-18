import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Lazy singleton DB. Aucune connexion n'est ouverte tant que `db()` n'est pas appelé,
 * ce qui permet aux pages statiques (landing, pricing, legal) de builder sans DATABASE_URL.
 */
export function db() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL manquante (cf. .env.example)");
  }
  _pool = new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30_000,
  });
  _db = drizzle(_pool, { schema, casing: "snake_case" });
  return _db;
}

export { schema };
