import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket: string;
}

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let adminStorage: Storage | null = null;

function getAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  console.log("[Firebase Config Debug]", {
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    hasStorageBucket: !!storageBucket,
    privateKeyLength: privateKey?.length || 0,
  });

  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    const missing = [];
    if (!projectId) missing.push("FIREBASE_PROJECT_ID");
    if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");
    if (!storageBucket) missing.push("FIREBASE_STORAGE_BUCKET");
    
    const error = `Missing Firebase environment variables: ${missing.join(", ")}`;
    console.error("[Firebase Config Error]", error);
    throw new Error(error);
  }

  return { projectId, clientEmail, privateKey, storageBucket };
}

export function initializeFirebaseAdmin(): App {
  if (adminApp) {
    console.log("[Firebase] Already initialized, returning cached app");
    return adminApp;
  }

  try {
    console.log("[Firebase] Initializing Firebase Admin SDK...");
    const config = getAdminConfig();

    adminApp = initializeApp({
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
      storageBucket: config.storageBucket,
    });

    console.log("[Firebase] Successfully initialized");
    return adminApp;
  } catch (err) {
    console.error("[Firebase] Initialization failed:", err instanceof Error ? err.message : String(err));
    throw err;
  }
}

export function getFirebaseAdminAuth(): Auth {
  if (!adminAuth) {
    const app = initializeFirebaseAdmin();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

export function getFirebaseAdminFirestore(): Firestore {
  if (!adminDb) {
    const app = initializeFirebaseAdmin();
    adminDb = getFirestore(app);
    // Disable deprecated features
    adminDb.settings({ ignoreUndefinedProperties: true });
  }
  return adminDb;
}

export function getFirebaseAdminStorage(): Storage {
  if (!adminStorage) {
    const app = initializeFirebaseAdmin();
    adminStorage = getStorage(app);
  }
  return adminStorage;
}

export function resetFirebaseAdmin(): void {
  adminApp = null;
  adminAuth = null;
  adminDb = null;
  adminStorage = null;
}