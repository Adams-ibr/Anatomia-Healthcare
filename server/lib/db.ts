import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Drizzle operations will fail.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost/postgres",
});

export const db = drizzle(pool, { schema });
export { pool };