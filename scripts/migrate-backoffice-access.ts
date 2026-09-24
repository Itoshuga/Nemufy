import { existsSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import {
  artistPermissionPresets,
  labelPermissionPresets,
} from "../src/lib/permissions/presets";
import type {
  ArtistMembershipRole,
  ArtistPermissions,
  LabelMembershipRole,
  LabelPermissions,
} from "../src/types/platform";

process.loadEnvFile?.(existsSync(".env.local") ? ".env.local" : ".env");

const apply = process.argv.includes("--apply");
const requiredEnvironment = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
] as const;

for (const key of requiredEnvironment) {
  if (!process.env[key]) throw new Error(`Missing ${key}.`);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID as string;
const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    projectId,
  });
const firestore = getFirestore(app);
const auth = getAuth(app);

type MigrationUpdate = {
  reference: QueryDocumentSnapshot["ref"];
  data: DocumentData;
};

function overridesFromLegacy<T extends Record<string, boolean>>(
  materialized: Partial<T> | undefined,
  preset: T,
  existing: Partial<T> | undefined,
) {
  const overrides = { ...(existing ?? {}) } as Partial<T>;
  if (materialized) {
    for (const key of Object.keys(preset) as Array<keyof T>) {
      if (
        typeof materialized[key] === "boolean" &&
        materialized[key] !== preset[key]
      ) {
        (overrides as Record<string, boolean>)[String(key)] = materialized[
          key
        ] as boolean;
      }
    }
  }
  return overrides;
}

async function collectMembershipUpdates() {
  const updates: MigrationUpdate[] = [];
  const [artistSnapshot, labelSnapshot] = await Promise.all([
    firestore.collection("artistMemberships").get(),
    firestore.collection("labelMemberships").get(),
  ]);

  for (const document of artistSnapshot.docs) {
    const data = document.data() as {
      role: ArtistMembershipRole;
      permissions?: ArtistPermissions;
      permissionOverrides?: Partial<ArtistPermissions>;
    };
    if (!data.permissions) continue;
    const permissionOverrides = overridesFromLegacy(
      data.permissions,
      artistPermissionPresets[data.role],
      data.permissionOverrides,
    );
    updates.push({
      reference: document.ref,
      data: {
        permissions: FieldValue.delete(),
        permissionOverrides,
        updatedAt: Timestamp.now(),
      },
    });
  }

  for (const document of labelSnapshot.docs) {
    const data = document.data() as {
      role: LabelMembershipRole;
      permissions?: LabelPermissions;
      permissionOverrides?: Partial<LabelPermissions>;
    };
    if (!data.permissions) continue;
    const permissionOverrides = overridesFromLegacy(
      data.permissions,
      labelPermissionPresets[data.role],
      data.permissionOverrides,
    );
    updates.push({
      reference: document.ref,
      data: {
        permissions: FieldValue.delete(),
        permissionOverrides,
        updatedAt: Timestamp.now(),
      },
    });
  }

  return updates;
}

async function collectLegacyClaimUsers() {
  const userIds: string[] = [];
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      if (
        user.customClaims?.artist === true ||
        user.customClaims?.label === true
      ) {
        userIds.push(user.uid);
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return userIds;
}

async function main() {
  const [membershipUpdates, legacyClaimUsers] = await Promise.all([
    collectMembershipUpdates(),
    collectLegacyClaimUsers(),
  ]);

  console.log(apply ? "APPLY migration" : "DRY RUN (use --apply to write)");
  console.log("Firebase project:", projectId);
  console.log("Memberships to normalize:", membershipUpdates.length);
  console.log(
    "Users with legacy artist/label claims:",
    legacyClaimUsers.length,
  );

  if (!apply) return;

  for (let offset = 0; offset < membershipUpdates.length; offset += 400) {
    const batch = firestore.batch();
    for (const update of membershipUpdates.slice(offset, offset + 400)) {
      batch.update(update.reference, update.data);
    }
    await batch.commit();
  }

  for (const uid of legacyClaimUsers) {
    const user = await auth.getUser(uid);
    await auth.setCustomUserClaims(uid, {
      ...(user.customClaims ?? {}),
      artist: undefined,
      label: undefined,
    });
  }

  console.log("Migration complete. Existing users must refresh their session.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
