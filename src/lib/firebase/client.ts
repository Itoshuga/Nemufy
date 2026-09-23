import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { z } from "zod";

const firebaseClientConfigSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
});

const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseClientApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();

  const parsedConfig =
    firebaseClientConfigSchema.safeParse(firebaseClientConfig);
  if (!parsedConfig.success) {
    throw new Error(
      "Firebase Web configuration is incomplete. Check NEXT_PUBLIC_FIREBASE_* variables.",
    );
  }

  return initializeApp(parsedConfig.data);
}

export const shouldUseFirebaseEmulators = () =>
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
