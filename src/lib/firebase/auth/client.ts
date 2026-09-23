import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirebaseClientApp,
  shouldUseFirebaseEmulators,
} from "@/lib/firebase/client";

let emulatorConnected = false;
let persistenceConfigured = false;

export function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseClientApp());

  if (
    typeof window !== "undefined" &&
    shouldUseFirebaseEmulators() &&
    !emulatorConnected
  ) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    emulatorConnected = true;
  }

  if (typeof window !== "undefined" && !persistenceConfigured) {
    void setPersistence(auth, browserLocalPersistence);
    persistenceConfigured = true;
  }

  return auth;
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: "select_account" });

export async function createServerSession(user: User, forceRefresh = false) {
  const idToken = await user.getIdToken(forceRefresh);
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const payload = (await response.json()) as {
    destination?: string;
    message?: string;
  };

  if (!response.ok || !payload.destination) {
    throw new Error(payload.message ?? "Unable to create a secure session.");
  }

  return payload.destination;
}

export async function clearServerSession() {
  await fetch("/api/auth/session", { method: "DELETE" });
}
