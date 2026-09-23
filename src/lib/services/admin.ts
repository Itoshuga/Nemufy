import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import type { ActiveSession } from "@/lib/firebase/auth/server";
import { syncSystemCapabilityClaims } from "@/lib/firebase/auth/claims";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { writeAuditLog } from "@/lib/firebase/firestore/repositories/audit-logs";
import { PlatformError, forbidden } from "@/lib/errors/platform-error";
import {
  accountStatusSchema,
  subscriptionSchema,
  userCapabilitiesSchema,
} from "@/lib/validation/platform";
import type { UserDocument } from "@/types/firestore";

function assertAdmin(actor: ActiveSession) {
  if (!actor.user.claims.admin) throw forbidden();
}

export async function updateUserCapabilities(
  actor: ActiveSession,
  uid: string,
  input: unknown,
) {
  assertAdmin(actor);
  const { capabilities } = userCapabilitiesSchema.parse(input);
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection(collections.users).doc(uid);
  const previous = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError("USER_NOT_FOUND", "User not found.", 404);
    }
    const user = snapshot.data() as UserDocument;
    transaction.update(reference, {
      capabilities,
      updatedAt: Timestamp.now(),
    });
    return {
      artist: user.capabilities?.artist === true,
      label: user.capabilities?.label === true,
      admin: user.capabilities?.admin === true,
    };
  });

  try {
    await syncSystemCapabilityClaims(uid, capabilities);
  } catch (error) {
    await reference.update({
      capabilities: previous,
      updatedAt: Timestamp.now(),
    });
    throw error;
  }

  const changed = (
    Object.keys(capabilities) as (keyof typeof capabilities)[]
  ).filter((key) => capabilities[key] !== previous[key]);
  await Promise.all(
    changed.map((capability) =>
      writeAuditLog({
        actorUserId: actor.user.uid,
        action: capabilities[capability] ? "role.grant" : "role.revoke",
        targetType: "user",
        targetId: uid,
        context: {},
        metadata: { capability },
      }),
    ),
  );
  return { requiresTokenRefresh: true };
}

export async function updateAccountStatus(
  actor: ActiveSession,
  uid: string,
  input: unknown,
) {
  assertAdmin(actor);
  const { accountStatus } = accountStatusSchema.parse(input);
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection(collections.users).doc(uid);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError("USER_NOT_FOUND", "User not found.", 404);
    }
    transaction.update(reference, {
      accountStatus,
      updatedAt: Timestamp.now(),
    });
  });
  if (accountStatus === "suspended") {
    await getFirebaseAdminAuth().revokeRefreshTokens(uid);
  }
  await writeAuditLog({
    actorUserId: actor.user.uid,
    action: accountStatus === "suspended" ? "user.suspend" : "user.reactivate",
    targetType: "user",
    targetId: uid,
    context: {},
  });
}

export async function updateArtistModeration(
  actor: ActiveSession,
  artistId: string,
  input: { verified?: boolean; status?: "active" | "suspended" | "archived" },
) {
  assertAdmin(actor);
  if (input.verified === undefined && input.status === undefined) {
    throw new PlatformError("VALIDATION_ERROR", "No change was provided.", 400);
  }
  const reference = getFirebaseAdminFirestore()
    .collection(collections.artists)
    .doc(artistId);
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    throw new PlatformError("ARTIST_NOT_FOUND", "Artist not found.", 404);
  }
  await reference.update({ ...input, updatedAt: Timestamp.now() });
  await writeAuditLog({
    actorUserId: actor.user.uid,
    action:
      input.verified !== undefined
        ? "artist.verify"
        : input.status === "suspended"
          ? "artist.suspend"
          : "artist.update",
    targetType: "artist",
    targetId: artistId,
    context: { artistId },
    metadata: input,
  });
}

export async function updateSubscription(
  actor: ActiveSession,
  uid: string,
  input: unknown,
) {
  assertAdmin(actor);
  const subscription = subscriptionSchema.parse(input);
  const reference = getFirebaseAdminFirestore()
    .collection(collections.users)
    .doc(uid);
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    throw new PlatformError("USER_NOT_FOUND", "User not found.", 404);
  }
  await reference.update({ ...subscription, updatedAt: Timestamp.now() });
  await writeAuditLog({
    actorUserId: actor.user.uid,
    action: "subscription.update",
    targetType: "user",
    targetId: uid,
    context: {},
    metadata: subscription,
  });
}
