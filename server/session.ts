import session from "express-session";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);
const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

export const sessionStore = new SessionStore({
  checkPeriod: 86400000, // prune expired entries every 24h
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
