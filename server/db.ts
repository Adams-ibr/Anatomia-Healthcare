import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure SSL for production (e.g. Vercel + Supabase)
// Supabase Transaction Pooler (port 6543) requires explicit SSL handling in many environments
const sslConfig = process.env.NODE_ENV === "production" \
  ?{ rejectUnauthorized: false } \
  : undefined;

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});

export const db = drizzle(pool, { schema });
