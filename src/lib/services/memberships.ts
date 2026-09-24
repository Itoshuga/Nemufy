import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import type { ActiveSession } from "@/lib/firebase/auth/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { createAuditLogInTransaction } from "@/lib/firebase/firestore/repositories/audit-logs";
import { PlatformError } from "@/lib/errors/platform-error";
import {
  requireArtistPermission,
  requireLabelPermission,
} from "@/lib/permissions/server";
import type {
  ArtistMembershipDocument,
  LabelMembershipDocument,
} from "@/types/firestore";

const artistChangeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("role"),
    role: z.enum(["owner", "manager", "editor", "viewer"]),
  }),
  z.object({ action: z.literal("revoke") }),
]);
const labelChangeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("role"),
    role: z.enum(["owner", "admin", "manager", "editor", "viewer"]),
  }),
  z.object({ action: z.literal("revoke") }),
]);

export async function changeArtistMembership(
  actor: ActiveSession,
  artistId: string,
  membershipId: string,
  input: unknown,
) {
  const change = artistChangeSchema.parse(input);
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "artist:manage-team",
  );
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore
    .collection(collections.artistMemberships)
    .doc(membershipId);
  const ownersQuery = firestore
    .collection(collections.artistMemberships)
    .where("artistId", "==", artistId)
    .where("role", "==", "owner")
    .where("status", "==", "active");
  await firestore.runTransaction(async (transaction) => {
    const [snapshot, owners] = await Promise.all([
      transaction.get(reference),
      transaction.get(ownersQuery),
    ]);
    if (!snapshot.exists)
      throw new PlatformError(
        "MEMBERSHIP_REQUIRED",
        "Membership not found.",
        404,
      );
    const membership = snapshot.data() as ArtistMembershipDocument;
    if (membership.artistId !== artistId)
      throw new PlatformError(
        "FORBIDDEN",
        "Membership belongs to another artist.",
        403,
      );
    if (
      membership.role === "owner" &&
      owners.size <= 1 &&
      (change.action === "revoke" || change.role !== "owner")
    ) {
      throw new PlatformError(
        "VALIDATION_ERROR",
        "An artist must keep at least one active owner.",
        409,
      );
    }
    const now = Timestamp.now();
    if (change.action === "revoke")
      transaction.update(reference, { status: "revoked", updatedAt: now });
    else
      transaction.update(reference, {
        role: change.role,
        permissionOverrides: {},
        status: "active",
        updatedAt: now,
      });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action:
        change.action === "revoke"
          ? "artist.member.remove"
          : "artist.member.role-change",
      targetType: "membership",
      targetId: membershipId,
      context: { artistId },
      metadata: change,
    });
  });
}

export async function changeLabelMembership(
  actor: ActiveSession,
  labelId: string,
  membershipId: string,
  input: unknown,
) {
  const change = labelChangeSchema.parse(input);
  await requireLabelPermission(
    actor.user.uid,
    actor.user.claims.admin,
    labelId,
    "label:manage-team",
  );
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore
    .collection(collections.labelMemberships)
    .doc(membershipId);
  const ownersQuery = firestore
    .collection(collections.labelMemberships)
    .where("labelId", "==", labelId)
    .where("role", "==", "owner")
    .where("status", "==", "active");
  await firestore.runTransaction(async (transaction) => {
    const [snapshot, owners] = await Promise.all([
      transaction.get(reference),
      transaction.get(ownersQuery),
    ]);
    if (!snapshot.exists)
      throw new PlatformError(
        "MEMBERSHIP_REQUIRED",
        "Membership not found.",
        404,
      );
    const membership = snapshot.data() as LabelMembershipDocument;
    if (membership.labelId !== labelId)
      throw new PlatformError(
        "FORBIDDEN",
        "Membership belongs to another label.",
        403,
      );
    if (
      membership.role === "owner" &&
      owners.size <= 1 &&
      (change.action === "revoke" || change.role !== "owner")
    ) {
      throw new PlatformError(
        "VALIDATION_ERROR",
        "A label must keep at least one active owner.",
        409,
      );
    }
    const now = Timestamp.now();
    if (change.action === "revoke")
      transaction.update(reference, { status: "revoked", updatedAt: now });
    else
      transaction.update(reference, {
        role: change.role,
        permissionOverrides: {},
        status: "active",
        updatedAt: now,
      });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action:
        change.action === "revoke"
          ? "label.member.remove"
          : "label.member.role-change",
      targetType: "membership",
      targetId: membershipId,
      context: { labelId },
      metadata: change,
    });
  });
}
