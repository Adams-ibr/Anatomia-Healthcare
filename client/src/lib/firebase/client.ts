import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";

interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

let clientApp: FirebaseApp | null = null;
let clientAuth: Auth | null = null;
let clientDb: Firestore | null = null;
let clientStorage: FirebaseStorage | null = null;

function getClientConfig(): FirebaseClientConfig {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase Client environment variables: ${missing.join(", ")}`
    );
  }

  return config as FirebaseClientConfig;
}

export function initializeFirebaseClient(): FirebaseApp {
  if (clientApp) return clientApp;

  const config = getClientConfig();

  clientApp = initializeApp(config);

  return clientApp;
}

export function getFirebaseClientAuth(): Auth {
  if (!clientAuth) {
    const app = initializeFirebaseClient();
    clientAuth = getAuth(app);
  }
  return clientAuth;
}

export function getFirebaseClientFirestore(): Firestore {
  if (!clientDb) {
    const app = initializeFirebaseClient();
    clientDb = getFirestore(app);
  }
  return clientDb;
}

export function getFirebaseClientStorage(): FirebaseStorage {
  if (!clientStorage) {
    const app = initializeFirebaseClient();
    clientStorage = getStorage(app);
  }
  return clientStorage;
}

export function resetFirebaseClient(): void {
  clientApp = null;
  clientAuth = null;
  clientDb = null;
  clientStorage = null;
}

// Initialize on import
initializeFirebaseClient();

export const auth = getFirebaseClientAuth();
export const db = getFirebaseClientFirestore();
export const storage = getFirebaseClientStorage();

// Emulator support for development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  const authEmulator = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR || "http://localhost:9099";
  const firestoreEmulator = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR || "http://localhost:8080";
  const storageEmulator = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR || "http://localhost:9199";

  connectAuthEmulator(auth, authEmulator);
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
}