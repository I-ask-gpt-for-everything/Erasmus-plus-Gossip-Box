import { isFirebaseConfigured } from "./firebase";
import {
  localAdminLogin,
  localAdminLogout,
  localSubscribeAdminSession,
} from "./localBackend";
import {
  firestoreAdminLogin,
  firestoreAdminLogout,
  firestoreSubscribeAdminSession,
} from "./firestoreBackend";

export type AdminCredentials =
  | { mode: "local"; passcode: string }
  | { mode: "firebase"; email: string; password: string };

export function subscribeAdminSession(
  callback: (isAdmin: boolean) => void
): () => void {
  return isFirebaseConfigured
    ? firestoreSubscribeAdminSession(callback)
    : localSubscribeAdminSession(callback);
}

export async function adminLogin(
  credentials: AdminCredentials
): Promise<{ ok: boolean; error?: string }> {
  if (credentials.mode === "firebase") {
    return firestoreAdminLogin(credentials.email, credentials.password);
  }
  const ok = localAdminLogin(credentials.passcode);
  return ok ? { ok: true } : { ok: false, error: "Incorrect passcode." };
}

export async function adminLogout(): Promise<void> {
  if (isFirebaseConfigured) {
    await firestoreAdminLogout();
  } else {
    localAdminLogout();
  }
}
