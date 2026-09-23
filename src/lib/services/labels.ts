import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import type { ActiveSession } from "@/lib/firebase/auth/server";
import { ensureSystemCapabilityClaim } from "@/lib/firebase/auth/claims";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { createAuditLogInTransaction } from "@/lib/firebase/firestore/repositories/audit-logs";
import { labelArtistRelationId } from "@/lib/firebase/firestore/repositories/label-artists";
import { labelMembershipId } from "@/lib/firebase/firestore/repositories/label-memberships";
import { getLabelPermissions } from "@/lib/permissions/presets";
import {
  requireArtistPermission,
  requireLabelPermission,
} from "@/lib/permissions/server";
import {
  createLabelSchema,
  toSlug,
  updateLabelSchema,
} from "@/lib/validation/platform";
import type {
  LabelArtistRelationDocument,
  LabelDocument,
  LabelMembershipDocument,
  UserDocument,
} from "@/types/firestore";
import { PlatformError } from "@/lib/errors/platform-error";

export async function createLabel(actor: ActiveSession, input: unknown) {
  if (!actor.profile.capabilities.label && !actor.user.claims.admin) {
    throw new PlatformError(
      "FORBIDDEN",
      "Label capability is required before creating a label.",
      403,
    );
  }
  const data = createLabelSchema.parse(input);
  const firestore = getFirebaseAdminFirestore();
  const labelReference = firestore.collection(collections.labels).doc();
  const membershipReference = firestore
    .collection(collections.labelMemberships)
    .doc(labelMembershipId(actor.user.uid, labelReference.id));
  const userReference = firestore
    .collection(collections.users)
    .doc(actor.user.uid);
  const now = Timestamp.now();

  await firestore.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userReference);
    const user = userSnapshot.data() as UserDocument | undefined;
    if (!user) {
      throw new PlatformError("USER_NOT_FOUND", "User profile not found.", 404);
    }
    const label: LabelDocument = {
      name: data.name,
      slug: `${toSlug(data.name)}-${labelReference.id.slice(0, 6)}`,
      logoUrl: null,
      logoStoragePath: null,
      bannerUrl: null,
      bannerStoragePath: null,
      description: data.description || null,
      websiteUrl: data.websiteUrl || null,
      verified: false,
      status: "active",
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    const membership: LabelMembershipDocument = {
      userId: actor.user.uid,
      labelId: labelReference.id,
      role: "owner",
      permissions: getLabelPermissions("owner"),
      status: "active",
      invitedBy: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    transaction.create(labelReference, label);
    transaction.create(membershipReference, membership);
    transaction.update(userReference, {
      capabilities: {
        artist: user.capabilities?.artist === true,
        label: true,
        admin: user.capabilities?.admin === true,
      },
      updatedAt: now,
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "label.create",
      targetType: "label",
      targetId: labelReference.id,
      context: { labelId: labelReference.id },
    });
  });
  await ensureSystemCapabilityClaim(actor.user.uid, "label");
  return { id: labelReference.id };
}

export async function updateLabel(
  actor: ActiveSession,
  labelId: string,
  input: unknown,
) {
  const data = updateLabelSchema.parse(input);
  await requireLabelPermission(
    actor.user.uid,
    actor.user.claims.admin,
    labelId,
    "label:edit",
  );
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection(collections.labels).doc(labelId);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError("LABEL_NOT_FOUND", "Label not found.", 404);
    }
    transaction.update(reference, {
      name: data.name,
      description: data.description || null,
      websiteUrl: data.websiteUrl || null,
      updatedAt: Timestamp.now(),
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "label.update",
      targetType: "label",
      targetId: labelId,
      context: { labelId },
    });
  });
}

export async function createArtistForLabel(
  actor: ActiveSession,
  labelId: string,
  input: unknown,
) {
  const data = createLabelSchema
    .pick({ name: true, description: true })
    .parse(input);
  await requireLabelPermission(
    actor.user.uid,
    actor.user.claims.admin,
    labelId,
    "label:manage-artists",
  );
  const firestore = getFirebaseAdminFirestore();
  const artistReference = firestore.collection(collections.artists).doc();
  const relationReference = firestore
    .collection(collections.labelArtists)
    .doc(labelArtistRelationId(labelId, artistReference.id));
  const labelReference = firestore.collection(collections.labels).doc(labelId);
  const now = Timestamp.now();
  await firestore.runTransaction(async (transaction) => {
    const labelSnapshot = await transaction.get(labelReference);
    if (!labelSnapshot.exists) {
      throw new PlatformError("LABEL_NOT_FOUND", "Label not found.", 404);
    }
    transaction.create(artistReference, {
      name: data.name,
      displayName: data.name,
      slug: `${toSlug(data.name)}-${artistReference.id.slice(0, 6)}`,
      avatarUrl: null,
      bannerUrl: null,
      avatarStoragePath: null,
      bannerStoragePath: null,
      bio: data.description,
      verified: false,
      status: "active",
      monthlyListeners: 0,
      followerCount: 0,
      categoryIds: [],
      links: [],
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    });
    const relation: LabelArtistRelationDocument = {
      labelId,
      artistId: artistReference.id,
      status: "active",
      permissions: {
        manageProfile: true,
        manageReleases: true,
        manageTracks: true,
        publish: true,
      },
      joinedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    transaction.create(relationReference, relation);
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "label.artist.add",
      targetType: "artist",
      targetId: artistReference.id,
      context: { artistId: artistReference.id, labelId },
      metadata: { createdByLabel: true },
    });
  });
  return { id: artistReference.id };
}

export async function requestArtistLink(
  actor: ActiveSession,
  labelId: string,
  artistId: string,
) {
  await requireLabelPermission(
    actor.user.uid,
    actor.user.claims.admin,
    labelId,
    "label:manage-artists",
  );
  const firestore = getFirebaseAdminFirestore();
  const artistReference = firestore
    .collection(collections.artists)
    .doc(artistId);
  const labelReference = firestore.collection(collections.labels).doc(labelId);
  const relationReference = firestore
    .collection(collections.labelArtists)
    .doc(labelArtistRelationId(labelId, artistId));
  const now = Timestamp.now();
  await firestore.runTransaction(async (transaction) => {
    const [artistSnapshot, labelSnapshot, relationSnapshot] = await Promise.all(
      [
        transaction.get(artistReference),
        transaction.get(labelReference),
        transaction.get(relationReference),
      ],
    );
    if (!artistSnapshot.exists)
      throw new PlatformError("ARTIST_NOT_FOUND", "Artist not found.", 404);
    if (!labelSnapshot.exists)
      throw new PlatformError("LABEL_NOT_FOUND", "Label not found.", 404);
    if (relationSnapshot.exists)
      throw new PlatformError(
        "VALIDATION_ERROR",
        "This relationship already exists.",
        409,
      );
    transaction.create(relationReference, {
      labelId,
      artistId,
      status: "pending",
      permissions: {
        manageProfile: true,
        manageReleases: true,
        manageTracks: true,
        publish: true,
      },
      joinedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    } satisfies LabelArtistRelationDocument);
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "label.artist.add",
      targetType: "artist",
      targetId: artistId,
      context: { artistId, labelId },
      metadata: { status: "pending" },
    });
  });
}

export async function changeLabelArtistRelation(
  actor: ActiveSession,
  labelId: string,
  artistId: string,
  action: "activate" | "end",
) {
  if (action === "activate") {
    await requireArtistPermission(
      actor.user.uid,
      actor.user.claims.admin,
      artistId,
      "artist:manage-team",
    );
  } else {
    await requireLabelPermission(
      actor.user.uid,
      actor.user.claims.admin,
      labelId,
      "label:manage-artists",
    );
  }
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore
    .collection(collections.labelArtists)
    .doc(labelArtistRelationId(labelId, artistId));
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError(
        "VALIDATION_ERROR",
        "Label relationship not found.",
        404,
      );
    }
    const relation = snapshot.data() as LabelArtistRelationDocument;
    if (relation.labelId !== labelId || relation.artistId !== artistId) {
      throw new PlatformError("FORBIDDEN", "Relationship mismatch.", 403);
    }
    const now = Timestamp.now();
    transaction.update(reference, {
      status: action === "activate" ? "active" : "ended",
      ...(action === "activate"
        ? { joinedAt: now, endedAt: null }
        : { endedAt: now }),
      updatedAt: now,
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action:
        action === "activate" ? "label.artist.add" : "label.artist.remove",
      targetType: "artist",
      targetId: artistId,
      context: { artistId, labelId },
      metadata: { relationshipAction: action },
    });
  });
}
