import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { z } from "zod";

const adminEnvironmentSchema = z.object({
  projectId: z.string().min(1),
  clientEmail: z.email(),
  privateKey: z.string().min(1),
  storageBucket: z.string().min(1),
});

function getAdminEnvironment() {
  const parsedEnvironment = adminEnvironmentSchema.safeParse({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    storageBucket:
      process.env.FIREBASE_ADMIN_STORAGE_BUCKET ??
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  if (!parsedEnvironment.success) {
    throw new Error(
      "Firebase Admin configuration is incomplete. Check FIREBASE_ADMIN_* variables.",
    );
  }

  return parsedEnvironment.data;
}

export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) return getApp();

  const environment = getAdminEnvironment();
  const usingEmulators = Boolean(
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST,
  );

  return initializeApp({
    projectId: environment.projectId,
    storageBucket: environment.storageBucket,
    ...(usingEmulators
      ? {}
      : {
          credential: cert({
            projectId: environment.projectId,
            clientEmail: environment.clientEmail,
            privateKey: environment.privateKey,
          }),
        }),
  });
}

export const getFirebaseAdminAuth = () => getAuth(getFirebaseAdminApp());
export const getFirebaseAdminFirestore = () =>
  getFirestore(getFirebaseAdminApp());
export const getFirebaseAdminStorage = () => getStorage(getFirebaseAdminApp());
