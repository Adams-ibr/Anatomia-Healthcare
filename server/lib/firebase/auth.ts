import {
  getAuth,
  UserRecord,
  CreateRequest,
  UpdateRequest,
  DecodedIdToken,
  Auth,
} from "firebase-admin/auth";
import { getFirebaseAdminAuth } from "./admin";

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  customClaims?: Record<string, unknown>;
}

export function toAuthUser(user: UserRecord): AuthUser {
  return {
    uid: user.uid,
    email: user.email ?? null,
    emailVerified: user.emailVerified,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    phoneNumber: user.phoneNumber ?? null,
    disabled: user.disabled,
    metadata: {
      creationTime: user.metadata.creationTime ?? "",
      lastSignInTime: user.metadata.lastSignInTime ?? "",
    },
    customClaims: user.customClaims,
  };
}

export async function createUser(data: CreateRequest): Promise<AuthUser> {
  const auth = getFirebaseAdminAuth();
  const user = await auth.createUser(data);
  return toAuthUser(user);
}

export async function getUserByUid(uid: string): Promise<AuthUser | null> {
  const auth = getFirebaseAdminAuth();
  try {
    const user = await auth.getUser(uid);
    return toAuthUser(user);
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const auth = getFirebaseAdminAuth();
  try {
    const user = await auth.getUserByEmail(email);
    return toAuthUser(user);
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
}

export async function updateUser(uid: string, data: UpdateRequest): Promise<AuthUser> {
  const auth = getFirebaseAdminAuth();
  const user = await auth.updateUser(uid, data);
  return toAuthUser(user);
}

export async function deleteUser(uid: string): Promise<void> {
  const auth = getFirebaseAdminAuth();
  await auth.deleteUser(uid);
}

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  const auth = getFirebaseAdminAuth();
  return auth.verifyIdToken(idToken);
}

export async function verifyIdTokenAndCheckRevoked(idToken: string): Promise<DecodedIdToken> {
  const auth = getFirebaseAdminAuth();
  return auth.verifyIdToken(idToken, true);
}

export async function createCustomToken(uid: string, claims?: Record<string, unknown>): Promise<string> {
  const auth = getFirebaseAdminAuth();
  return auth.createCustomToken(uid, claims);
}

export async function setCustomUserClaims(uid: string, claims: Record<string, unknown>): Promise<void> {
  const auth = getFirebaseAdminAuth();
  await auth.setCustomUserClaims(uid, claims);
}

export async function revokeRefreshTokens(uid: string): Promise<void> {
  const auth = getFirebaseAdminAuth();
  await auth.revokeRefreshTokens(uid);
}

export async function listUsers(maxResults = 1000, pageToken?: string): Promise<{ users: AuthUser[]; pageToken?: string }> {
  const auth = getFirebaseAdminAuth();
  const result = await auth.listUsers(maxResults, pageToken);
  return {
    users: result.users.map(toAuthUser),
    pageToken: result.pageToken,
  };
}

export async function importUsers(users: import("firebase-admin/auth").UserImportRecord[]): Promise<{ successCount: number; failureCount: number; errors: unknown[] }> {
  const auth = getFirebaseAdminAuth();
  const result = await auth.importUsers(users);
  return {
    successCount: result.successCount,
    failureCount: result.failureCount,
    errors: result.errors,
  };
}

export async function getUserByPhoneNumber(phoneNumber: string): Promise<AuthUser | null> {
  const auth = getFirebaseAdminAuth();
  try {
    const user = await auth.getUserByPhoneNumber(phoneNumber);
    return toAuthUser(user);
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
}

export function getAuthInstance(): Auth {
  return getFirebaseAdminAuth();
}