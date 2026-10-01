import session from "express-session";
import { getDocuments, createDocument, updateDocument, deleteDocument, getDocumentById, collections } from "./lib/firebase";
import { Store } from "express-session";
import { getFirebaseAdminFirestore } from "./lib/firebase";

// Type augmentation for SessionData
declare module "express-session" {
  interface SessionData {
    userId?: string;
    memberId?: string;
  }
}

interface FirebaseSession {
  sid: string;
  sess: session.SessionData;
  expire: number; // Timestamp in milliseconds
}

/**
 * Custom session store backed by Firebase Firestore.
 * Uses Firestore to persist session data.
 * Requires read/write permissions on "sessions" collection.
 */
class FirebaseSessionStore extends Store {
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
      const db = getFirebaseAdminFirestore();
      const now = Date.now();
      const expiredSessions = await getDocuments(collections.sessions, {
        filters: [{ field: "expire", operator: "<", value: now }],
      });

      let deletedCount = 0;
      for (const sessionDoc of expiredSessions) {
        await deleteDocument(collections.sessions, sessionDoc.sid);
        deletedCount++;
      }

      if (deletedCount > 0) {
        console.log(`[Session Cleanup] Removed ${deletedCount} expired sessions`);
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
      const sessionDoc = await getDocumentById<FirebaseSession>(collections.sessions, sid);

      if (!sessionDoc) {
        return callback(null, null);
      }

      // Check if session has expired
      const now = Date.now();
      if (sessionDoc.expire <= now) {
        // Session has expired, delete it and return null
        console.log(`[Session] Session ${sid} has expired, removing from store`);
        try {
          await deleteDocument(collections.sessions, sid);
        } catch (deleteErr) {
          console.error("Failed to delete expired session:", deleteErr);
        }
        return callback(null, null);
      }

      // Session is valid
      callback(null, sessionDoc.sess);
    } catch (err) {
      callback(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async set(sid: string, sessionData: session.SessionData, callback?: (err?: Error | null) => void): Promise<void> {
    try {
      const maxAge = sessionData.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      const expire = Date.now() + maxAge;

      const firebaseSession: FirebaseSession = {
        sid,
        sess: sessionData,
        expire,
      };

      await updateDocument(collections.sessions, sid, firebaseSession, { merge: true });
      callback?.(null);
    } catch (err) {
      callback?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async destroy(sid: string, callback?: (err?: Error | null) => void): Promise<void> {
    try {
      await deleteDocument(collections.sessions, sid);
      callback?.(null);
    } catch (err) {
      callback?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async touch(sid: string, sessionData: session.SessionData, callback?: (err?: Error | null) => void): Promise<void> {
    try {
      const maxAge = sessionData.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
      const expire = Date.now() + maxAge;

      await updateDocument(collections.sessions, sid, { expire }, { merge: true });
      callback?.(null);
    } catch (err) {
      callback?.(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export const sessionStore = new FirebaseSessionStore();

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