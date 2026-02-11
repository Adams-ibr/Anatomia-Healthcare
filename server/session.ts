import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import MemoryStore from "memorystore";
import pg from "pg";

const PgSession = connectPgSimple(session);
const MemStore = MemoryStore(session);

const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

// Detect if we have a database URL for persistent sessions
const hasDbUrl = !!process.env.DATABASE_URL;

if (!hasDbUrl) {
  console.warn("WARNING: DATABASE_URL not found. Using MemoryStore for sessions. detailed: This will not work correctly in serverless environments (Vercel) as sessions will be lost between requests.");
}

export const sessionStore = hasDbUrl
  ? new PgSession({
    conObject: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for Supabase/Neon
    },
    createTableIfMissing: true,
    tableName: "sessions",
  })
  : new MemStore({
    checkPeriod: 86400000,
  });

export function getSessionAsync(sid: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    sessionStore.get(sid, (err, session) => {
      if (err) {
        console.error("Session retrieval error:", err);
        return resolve(null);
      }
      resolve(session || null);
    });
  });
}
