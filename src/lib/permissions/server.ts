import "server-only";

import { getActiveSession } from "@/lib/firebase/auth/server";
import { getActiveLabelRelationsForArtist } from "@/lib/firebase/firestore/repositories/label-artists";
import { getArtistMembership } from "@/lib/firebase/firestore/repositories/artist-memberships";
import {
  getLabelMembership,
  getLabelsForUser,
} from "@/lib/firebase/firestore/repositories/label-memberships";
import { PlatformError, forbidden } from "@/lib/errors/platform-error";
import { can, type PermissionContext } from "@/lib/permissions/can";
import type { PermissionAction } from "@/types/platform";

export async function requireApiActor() {
  const session = await getActiveSession();
  if (!session) {
    throw new PlatformError(
      "UNAUTHENTICATED",
      "A valid active session is required.",
      401,
    );
  }
  return session;
}

export async function getArtistPermissionContext(
  userId: string,
  artistId: string,
  isAdmin: boolean,
): Promise<PermissionContext> {
  if (isAdmin) return { isAdmin: true };
  const artistMembership = await getArtistMembership(userId, artistId);
  if (artistMembership?.status === "active") {
    return { isAdmin: false, artistMembership };
  }

  const [labels, relations] = await Promise.all([
    getLabelsForUser(userId),
    getActiveLabelRelationsForArtist(artistId),
  ]);
  const labelPaths = relations.flatMap((relation) => {
    const membership = labels.find(
      (candidate) => candidate.membership.labelId === relation.labelId,
    )?.membership;
    return membership ? [{ membership, relation }] : [];
  });
  const firstPath = labelPaths[0];
  return {
    isAdmin: false,
    artistMembership,
    labelMembership: firstPath?.membership ?? null,
    labelArtistRelation: firstPath?.relation ?? null,
    labelPaths,
  };
}

export async function requireArtistPermission(
  userId: string,
  isAdmin: boolean,
  artistId: string,
  action: PermissionAction,
) {
  const context = await getArtistPermissionContext(userId, artistId, isAdmin);
  if (!can(context, action)) throw forbidden("INSUFFICIENT_PERMISSION");
  return context;
}

export async function requireLabelPermission(
  userId: string,
  isAdmin: boolean,
  labelId: string,
  action: PermissionAction,
) {
  const labelMembership = isAdmin
    ? null
    : await getLabelMembership(userId, labelId);
  const context: PermissionContext = { isAdmin, labelMembership };
  if (!can(context, action)) throw forbidden("INSUFFICIENT_PERMISSION");
  return context;
}
