import session from "express-session";
import { supabase } from "./db";
import { Store } from "express-session";

/**
 * Custom session store backed by Supabase.
 * Uses the existing Supabase client — no pg Pool needed.
 * Requires a "sessions" table with columns: sid (text PK), sess (jsonb), expire (timestamptz).
 */
class SupabaseSessionStore extends Store {
  constructor() {
    super();
  }

  async get(sid: string, callback: (err: any, session?: session.SessionData | null) => void) {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("sess")
        .eq("sid", sid)
        .single();

      if (error || !data) {
        return callback(null, null);
      }

      // Check if session has expired
      callback(null, data.sess as session.SessionData);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
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
      callback?.(error || undefined);
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("sid", sid);

      callback?.(error || undefined);
    } catch (err) {
      callback?.(err);
    }
  }

  async touch(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void) {
    try {
      const maxAge = sessionData.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      const expire = new Date(Date.now() + maxAge).toISOString();

      const { error } = await supabase
        .from("sessions")
        .update({ expire })
        .eq("sid", sid);

      callback?.(error || undefined);
    } catch (err) {
      callback?.(err);
    }
  }
}

export const sessionStore = new SupabaseSessionStore();

export function getSessionAsync(sid: string): Promise<any | null> {
  return new Promise((resolve) => {
    sessionStore.get(sid, (err, session) => {
      if (err) {
        console.error("Session retrieval error:", err);
        return resolve(null);
      }
      resolve(session || null);
    });
  });
}
