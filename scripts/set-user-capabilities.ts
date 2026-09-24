import { existsSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

async function main() {
  process.loadEnvFile?.(existsSync(".env.local") ? ".env.local" : ".env");

  const uid = readArgument("uid");
  if (!uid) {
    throw new Error(
      "Usage: pnpm firebase:set-capabilities -- --uid=<uid> [--artist=true] [--label=true] [--admin=true]",
    );
  }

  const required = [
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
  ] as const;
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing ${key}.`);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID as string;
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n",
        ),
      }),
      projectId,
    });

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const user = await auth.getUser(uid);
  const profileReference = firestore.collection("users").doc(uid);
  const profileSnapshot = await profileReference.get();
  if (!profileSnapshot.exists) {
    throw new Error(
      "The user must sign in once before capabilities are assigned.",
    );
  }

  const existing = profileSnapshot.data()?.capabilities ?? {
    artist: false,
    label: false,
    admin: false,
  };
  const capabilities = {
    artist: readBooleanArgument("artist") ?? existing.artist ?? false,
    label: readBooleanArgument("label") ?? existing.label ?? false,
    admin: readBooleanArgument("admin") ?? existing.admin ?? false,
  };

  await auth.setCustomUserClaims(uid, {
    ...(user.customClaims ?? {}),
    admin: capabilities.admin || undefined,
    // Artist and label access is derived from active memberships in Firestore.
    artist: undefined,
    label: undefined,
  });

  const batch = firestore.batch();
  batch.update(profileReference, { capabilities, updatedAt: Timestamp.now() });
  const auditReference = firestore.collection("auditLogs").doc();
  batch.create(auditReference, {
    actorUserId: "system:capability-cli",
    action: "role.bootstrap",
    targetType: "user",
    targetId: uid,
    context: {},
    metadata: { capabilities },
    createdAt: Timestamp.now(),
  });
  await batch.commit();

  console.log("Capabilities updated for", uid, capabilities);
  console.log(
    "The user must refresh their Firebase ID token and sign in again.",
  );
}

function readArgument(name: string) {
  return process.argv
    .find((argument) => argument.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
}

function readBooleanArgument(name: string) {
  const value = readArgument(name);
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`--${name} must be true or false.`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
