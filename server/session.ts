import session from "express-session";
import { supabase } from "./db";
import { Store } from "express-session";

// Type augmentation for SessionData
declare module "express-session" {
  interface SessionData {
    userId?: string;
    memberId?: string;
  }
}

/**
 * Custom session store backed by Supabase.
 * Uses the existing Supabase client — no pg Pool needed.
 * Requires a "sessions" table with columns: sid (text PK), sess (jsonb), expire (timestamptz).
 */
class SupabaseSessionStore extends Store {
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Start background cleanup every hour
    this.startCleanupInterval();
  }

  /**
   * Start a background task to clean up expired sessions
   */
  private startCleanupInterval(): void {
    // Run cleanup every hour (3600000ms)
    this.cleanupInterval = setInterval(() => {
      void this.cleanupExpiredSessions().catch((err) => {
        console.error("Error during session cleanup:", err);
      });
    }, 3600000);
    this.cleanupInterval.unref?.();

    // Also run cleanup on startup after a small delay
    const initialTimer = setTimeout(() => {
      void this.cleanupExpiredSessions().catch((err) => {
        console.error("Error during initial session cleanup:", err);
      });
    }, 5000);
    initialTimer.unref?.();
  }

  /**
   * Remove expired sessions from database
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const { error, count } = await supabase
        .from("sessions")
        .delete()
        .lt("expire", now);  // Delete where expire < now

      if (error) {
        console.error("Session cleanup error:", error);
      } else {
        console.log(`[Session Cleanup] Removed ${count} expired sessions`);
      }
    } catch (err) {
      console.error("Session cleanup exception:", err);
    }
  }

  /**
   * Stop cleanup interval (call on server shutdown)
   */
  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  async get(sid: string, callback: (err: Error | null, session?: session.SessionData | null) => void): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("sess, expire")
        .eq("sid", sid)
        .single();

      if (error || !data) {
        return callback(null, null);
      }

      // Check if session has expired
      const now = new Date();
      const expireDate = new Date(data.expire);

      if (expireDate <= now) {
        // Session has expired, delete it and return null
        console.log(`[Session] Session ${sid} has expired, removing from store`);
        try {
          await supabase
            .from("sessions")
            .delete()
            .eq("sid", sid);
        } catch (deleteErr) {
          console.error("Failed to delete expired session:", deleteErr);
        }
        return callback(null, null);
      }

      // Session is valid
      callback(null, data.sess as session.SessionData);
    } catch (err) {
      callback(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async set(sid: string, sessionData: session.SessionData, callback?: (err?: Error | null) => void): Promise<void> {
    try {
      const maxAge = sessionData.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      const expire = new Date(Date.now() + maxAge).toISOString();

      const { error } = await supabase
        .from("sessions")
        .upsert(
          { sid, sess: sessionData, expire },
          { onConflict: "sid" }
        );

      if (error) {
        console.error("Session set error:", error);
      }
      callback?.(error ? new Error(String(error)) : null);
    } catch (err) {
      callback?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async destroy(sid: string, callback?: (err?: Error | null) => void): Promise<void> {
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("sid", sid);

      callback?.(error ? new Error(String(error)) : null);
    } catch (err) {
      callback?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async touch(sid: string, sessionData: session.SessionData, callback?: (err?: Error | null) => void): Promise<void> {
    try {
      const maxAge = sessionData.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      const expire = new Date(Date.now() + maxAge).toISOString();

      const { error } = await supabase
        .from("sessions")
        .update({ expire })
        .eq("sid", sid);

      callback?.(error ? new Error(String(error)) : null);
    } catch (err) {
      callback?.(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export const sessionStore = new SupabaseSessionStore();

export function getSessionAsync(sid: string): Promise<session.SessionData | null> {
  return new Promise((resolve) => {
    sessionStore.get(sid, (err, sessionData) => {
      if (err) {
        console.error("Session retrieval error:", err);
        return resolve(null);
      }
      resolve(sessionData || null);
    });
  });
}

/**
 * Cleanup sessions on server shutdown
 */
export function cleanupSessions(): void {
  sessionStore.stopCleanup();
}

