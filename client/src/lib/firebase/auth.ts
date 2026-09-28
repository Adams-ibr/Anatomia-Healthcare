import {
  getAuth,
  User,
  UserCredential,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  linkWithPopup,
  unlink,
  fetchSignInMethodsForEmail,
  signInWithEmailLink,
  isSignInWithEmailLink,
  applyActionCode,
  confirmPasswordReset,
  verifyBeforeUpdateEmail,
  updateEmail,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getFirebaseClientAuth } from "./index";

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  isAnonymous: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
  }>;
}

export function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
    isAnonymous: user.isAnonymous,
    metadata: {
      creationTime: user.metadata.creationTime ?? "",
      lastSignInTime: user.metadata.lastSignInTime ?? "",
    },
    providerData: user.providerData.map(p => ({
      providerId: p.providerId,
      uid: p.uid,
      displayName: p.displayName,
      email: p.email,
      photoURL: p.photoURL,
      phoneNumber: p.phoneNumber,
    })),
  };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const auth = getFirebaseClientAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUser(result.user);
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthUser> {
  const auth = getFirebaseClientAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return toAuthUser(result.user);
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseClientAuth();
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseClientAuth();
  await sendPasswordResetEmail(auth, email);
}

export async function sendVerificationEmail(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function updateUserProfile(data: { displayName?: string; photoURL?: string }): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, data);
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (auth.currentUser && auth.currentUser.email) {
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  }
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
  const auth = getFirebaseClientAuth();
  return onAuthStateChanged(auth, user => {
    callback(user ? toAuthUser(user) : null);
  });
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const auth = getFirebaseClientAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return toAuthUser(result.user);
}

export async function signInWithApple(): Promise<AuthUser> {
  const auth = getFirebaseClientAuth();
  const provider = new OAuthProvider("apple.com");
  const result = await signInWithPopup(auth, provider);
  return toAuthUser(result.user);
}

export async function linkWithGoogle(): Promise<AuthUser> {
  const auth = getFirebaseClientAuth();
  if (!auth.currentUser) throw new Error("No user signed in");
  const provider = new GoogleAuthProvider();
  const result = await linkWithPopup(auth.currentUser, provider);
  return toAuthUser(result.user);
}

export async function linkWithApple(): Promise<AuthUser> {
  const auth = getFirebaseClientAuth();
  if (!auth.currentUser) throw new Error("No user signed in");
  const provider = new OAuthProvider("apple.com");
  const result = await linkWithPopup(auth.currentUser, provider);
  return toAuthUser(result.user);
}

export async function unlinkProvider(providerId: string): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (!auth.currentUser) throw new Error("No user signed in");
  await unlink(auth.currentUser, providerId);
}

export async function getSignInMethodsForEmail(email: string): Promise<string[]> {
  const auth = getFirebaseClientAuth();
  return fetchSignInMethodsForEmail(auth, email);
}

export async function signInWithEmailLinkAction(email: string, link: string): Promise<AuthUser> {
  const auth = getFirebaseClientAuth();
  if (isSignInWithEmailLink(auth, link)) {
    const result = await signInWithEmailLink(auth, email, link);
    return toAuthUser(result.user);
  }
  throw new Error("Invalid email link");
}

export async function applyActionCodeAction(code: string): Promise<void> {
  const auth = getFirebaseClientAuth();
  await applyActionCode(auth, code);
}

export async function confirmPasswordResetAction(code: string, newPassword: string): Promise<void> {
  const auth = getFirebaseClientAuth();
  await confirmPasswordReset(auth, code, newPassword);
}

export async function verifyBeforeUpdateEmailAction(newEmail: string, continueUrl: string): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (auth.currentUser) {
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail, { url: continueUrl, handleCodeInApp: true });
  }
}

export async function updateUserEmail(newEmail: string): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (auth.currentUser) {
    await updateEmail(auth.currentUser, newEmail);
  }
}

export async function deleteCurrentUser(): Promise<void> {
  const auth = getFirebaseClientAuth();
  if (auth.currentUser) {
    await deleteUser(auth.currentUser);
  }
}

export async function setAuthPersistence(type: "local" | "session" | "none"): Promise<void> {
  const auth = getFirebaseClientAuth();
  let persistence;
  switch (type) {
    case "local":
      persistence = browserLocalPersistence;
      break;
    case "session":
      persistence = browserSessionPersistence;
      break;
    case "none":
      persistence = inMemoryPersistence;
      break;
  }
  await setPersistence(auth, persistence);
}

export function getCurrentUser(): AuthUser | null {
  const auth = getFirebaseClientAuth();
  return auth.currentUser ? toAuthUser(auth.currentUser) : null;
}

export function getAuthInstance(): Auth {
  return getFirebaseClientAuth();
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getFirebaseClientAuth();
  if (auth.currentUser) {
    return auth.currentUser.getIdToken(forceRefresh);
  }
  return null;
}