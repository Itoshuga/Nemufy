import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { ensureSystemCapabilityClaim } from "@/lib/firebase/auth/claims";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { createAuditLogInTransaction } from "@/lib/firebase/firestore/repositories/audit-logs";
import { artistMembershipId } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { PlatformError } from "@/lib/errors/platform-error";
import { getArtistPermissions } from "@/lib/permissions/presets";
import { requireArtistPermission } from "@/lib/permissions/server";
import {
  createArtistSchema,
  toSlug,
  updateArtistSchema,
} from "@/lib/validation/platform";
import type {
  ArtistDocument,
  ArtistMembershipDocument,
  UserDocument,
} from "@/types/firestore";
import type { ActiveSession } from "@/lib/firebase/auth/server";

export async function createArtist(actor: ActiveSession, input: unknown) {
  if (!actor.profile.capabilities.artist && !actor.user.claims.admin) {
    throw new PlatformError(
      "FORBIDDEN",
      "Artist capability is required before creating an artist.",
      403,
    );
  }
  const data = createArtistSchema.parse(input);
  const firestore = getFirebaseAdminFirestore();
  const artistReference = firestore.collection(collections.artists).doc();
  const membershipReference = firestore
    .collection(collections.artistMemberships)
    .doc(artistMembershipId(actor.user.uid, artistReference.id));
  const userReference = firestore
    .collection(collections.users)
    .doc(actor.user.uid);
  const now = Timestamp.now();

  await firestore.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userReference);
    if (!userSnapshot.exists) {
      throw new PlatformError("USER_NOT_FOUND", "User profile not found.", 404);
    }
    const user = userSnapshot.data() as UserDocument;
    const artist: ArtistDocument = {
      name: data.name,
      displayName: data.displayName ?? data.name,
      slug: `${toSlug(data.name)}-${artistReference.id.slice(0, 6)}`,
      avatarUrl: null,
      bannerUrl: null,
      avatarStoragePath: null,
      bannerStoragePath: null,
      bio: data.biography,
      verified: false,
      status: "active",
      monthlyListeners: 0,
      followerCount: 0,
      categoryIds: [],
      links: [],
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    const membership: ArtistMembershipDocument = {
      userId: actor.user.uid,
      artistId: artistReference.id,
      role: "owner",
      permissions: getArtistPermissions("owner"),
      status: "active",
      invitedBy: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    transaction.create(artistReference, artist);
    transaction.create(membershipReference, membership);
    transaction.update(userReference, {
      capabilities: {
        artist: true,
        label: user.capabilities?.label === true,
        admin: user.capabilities?.admin === true,
      },
      updatedAt: now,
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "artist.create",
      targetType: "artist",
      targetId: artistReference.id,
      context: { artistId: artistReference.id },
    });
  });

  await ensureSystemCapabilityClaim(actor.user.uid, "artist");
  return { id: artistReference.id };
}

export async function updateArtist(
  actor: ActiveSession,
  artistId: string,
  input: unknown,
) {
  const data = updateArtistSchema.parse(input);
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "artist:edit",
  );
  if (
    data.avatarStoragePath &&
    !data.avatarStoragePath.startsWith(`artists/${artistId}/avatar/`)
  ) {
    throw new PlatformError(
      "VALIDATION_ERROR",
      "Invalid artist avatar storage path.",
      400,
    );
  }
  if (
    data.bannerStoragePath &&
    !data.bannerStoragePath.startsWith(`artists/${artistId}/banner/`)
  ) {
    throw new PlatformError(
      "VALIDATION_ERROR",
      "Invalid artist banner storage path.",
      400,
    );
  }

  const firestore = getFirebaseAdminFirestore();
  const artistReference = firestore
    .collection(collections.artists)
    .doc(artistId);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(artistReference);
    if (!snapshot.exists) {
      throw new PlatformError("ARTIST_NOT_FOUND", "Artist not found.", 404);
    }
    const now = Timestamp.now();
    transaction.update(artistReference, {
      name: data.name,
      displayName: data.displayName,
      bio: data.biography,
      categoryIds: data.categoryIds,
      links: data.links,
      ...(data.avatarUrl !== undefined
        ? { avatarUrl: data.avatarUrl || null }
        : {}),
      ...(data.avatarStoragePath !== undefined
        ? { avatarStoragePath: data.avatarStoragePath }
        : {}),
      ...(data.bannerUrl !== undefined
        ? { bannerUrl: data.bannerUrl || null }
        : {}),
      ...(data.bannerStoragePath !== undefined
        ? { bannerStoragePath: data.bannerStoragePath }
        : {}),
      updatedAt: now,
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "artist.update",
      targetType: "artist",
      targetId: artistId,
      context: { artistId },
    });
  });
}
