import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import type { ActiveSession } from "@/lib/firebase/auth/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { createAuditLogInTransaction } from "@/lib/firebase/firestore/repositories/audit-logs";
import {
  requireArtistPermission,
  requireLabelPermission,
} from "@/lib/permissions/server";
import type { InvitationDocument } from "@/types/firestore";

const invitationSchema = z.object({
  email: z.email(),
  role: z.enum(["owner", "admin", "manager", "editor"]),
});

export async function inviteArtistMember(
  actor: ActiveSession,
  artistId: string,
  input: unknown,
) {
  const data = invitationSchema
    .extend({ role: z.enum(["owner", "manager", "editor"]) })
    .parse(input);
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "artist:manage-team",
  );
  return createInvitation(actor, "artist", artistId, data.email, data.role);
}

export async function inviteLabelMember(
  actor: ActiveSession,
  labelId: string,
  input: unknown,
) {
  const data = invitationSchema.parse(input);
  await requireLabelPermission(
    actor.user.uid,
    actor.user.claims.admin,
    labelId,
    "label:manage-team",
  );
  return createInvitation(actor, "label", labelId, data.email, data.role);
}

async function createInvitation(
  actor: ActiveSession,
  type: "artist" | "label",
  targetId: string,
  email: string,
  role: InvitationDocument["role"],
) {
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection(collections.invitations).doc();
  const now = Timestamp.now();
  const invitation: InvitationDocument = {
    type,
    targetId,
    email: email.toLowerCase(),
    role,
    invitedBy: actor.user.uid,
    status: "pending",
    createdAt: now,
    expiresAt: Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000),
    schemaVersion: 1,
  };
  await firestore.runTransaction(async (transaction) => {
    transaction.create(reference, invitation);
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: `${type}.member.add`,
      targetType: "membership",
      targetId: reference.id,
      context:
        type === "artist" ? { artistId: targetId } : { labelId: targetId },
      metadata: { email: invitation.email, role },
    });
  });
  return { id: reference.id };
}
