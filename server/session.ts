import session from "express-session";
import connectPg from "connect-pg-simple";

import { pool } from "./db";

const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const pgStore = connectPg(session);

export const sessionStore = new pgStore({
  pool, // Use the shared pool
  createTableIfMissing: true,
  ttl: sessionTtl,
  tableName: "sessions",
});

export function getSessionAsync(sid: string): Promise<any | null> {
  return new Promise((resolve) => {
    sessionStore.get(sid, (err, session) => {
      if (err || !session) {
        resolve(null);
      } else {
        resolve(session);
      }
    });
  });
}
