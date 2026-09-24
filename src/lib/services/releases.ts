import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { ActiveSession } from "@/lib/firebase/auth/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { createAuditLogInTransaction } from "@/lib/firebase/firestore/repositories/audit-logs";
import { PlatformError } from "@/lib/errors/platform-error";
import { requireArtistPermission } from "@/lib/permissions/server";
import { getLabelIdForArtistAction } from "@/lib/permissions/can";
import {
  createReleaseSchema,
  createTrackSchema,
  firestoreIdSchema,
  reorderTracksSchema,
  releaseArtworkSchema,
  toSlug,
  trackArtworkSchema,
  updateReleaseSchema,
  updateTrackSchema,
} from "@/lib/validation/platform";
import type { ReleaseDocument, TrackDocument } from "@/types/firestore";

export function validateReleaseForPublishing(
  release: ReleaseDocument,
  tracks: TrackDocument[],
) {
  const errors: string[] = [];
  if (!release.title.trim()) errors.push("A title is required.");
  if (!release.coverUrl || !release.coverStoragePath) {
    errors.push("A release cover is required.");
  }
  if (release.primaryArtistIds.length === 0) {
    errors.push("A primary artist is required.");
  }
  if (tracks.length === 0) errors.push("At least one track is required.");
  if (tracks.some((track) => !track.audioUrl || !track.audioStoragePath)) {
    errors.push("Every track must have an uploaded audio file.");
  }
  if (
    tracks.some((track) => !track.title.trim() || track.durationSeconds <= 0)
  ) {
    errors.push("Every track needs valid metadata.");
  }
  return errors;
}

export async function createRelease(
  actor: ActiveSession,
  artistId: string,
  input: unknown,
) {
  const data = createReleaseSchema.parse(input);
  if (!data.primaryArtistIds.includes(artistId)) {
    throw new PlatformError(
      "VALIDATION_ERROR",
      "The managed artist must be a primary artist.",
      400,
    );
  }
  const permissionContext = await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "release:create",
  );
  const firestore = getFirebaseAdminFirestore();
  const releaseReference = firestore.collection(collections.releases).doc();
  const now = Timestamp.now();
  const allArtistIds = [
    ...new Set([...data.primaryArtistIds, ...data.featuredArtistIds]),
  ];
  const release: ReleaseDocument = {
    createdByUserId: actor.user.uid,
    labelId:
      getLabelIdForArtistAction(permissionContext, "release:create") ?? null,
    title: data.title,
    slug: `${toSlug(data.title)}-${releaseReference.id.slice(0, 6)}`,
    type: data.type,
    primaryArtistIds: data.primaryArtistIds,
    featuredArtistIds: data.featuredArtistIds,
    allArtistIds,
    coverUrl: null,
    coverStoragePath: null,
    description: data.description || null,
    releaseDate: Timestamp.fromDate(new Date(`${data.releaseDate}T12:00:00Z`)),
    status: "draft",
    copyright: data.copyright || null,
    explicit: data.explicit,
    durationSeconds: 0,
    tags: [],
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    archivedAt: null,
    schemaVersion: 1,
  };
  await firestore.runTransaction(async (transaction) => {
    transaction.create(releaseReference, release);
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "release.create",
      targetType: "release",
      targetId: releaseReference.id,
      context: { artistId },
    });
  });
  return { id: releaseReference.id };
}

export async function saveReleaseArtwork(
  actor: ActiveSession,
  artistId: string,
  releaseId: string,
  input: unknown,
) {
  const data = releaseArtworkSchema.parse(input);
  if (!data.coverStoragePath.startsWith(`releases/${releaseId}/cover/`)) {
    throw new PlatformError(
      "VALIDATION_ERROR",
      "Invalid release cover storage path.",
      400,
    );
  }
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "release:edit",
  );
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection(collections.releases).doc(releaseId);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const release = snapshot.data() as ReleaseDocument;
    if (!release.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Release does not belong to this artist.",
        403,
      );
    }
    transaction.update(reference, {
      coverUrl: data.coverUrl,
      coverStoragePath: data.coverStoragePath,
      updatedAt: Timestamp.now(),
    });
  });
}

export async function updateRelease(
  actor: ActiveSession,
  artistId: string,
  releaseId: string,
  input: unknown,
) {
  const data = updateReleaseSchema.parse(input);
  if (!data.primaryArtistIds.includes(artistId)) {
    throw new PlatformError(
      "VALIDATION_ERROR",
      "The managed artist must remain a primary artist.",
      400,
    );
  }
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "release:edit",
  );
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection(collections.releases).doc(releaseId);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const release = snapshot.data() as ReleaseDocument;
    if (!release.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Release does not belong to this artist.",
        403,
      );
    }
    if (release.status === "archived") {
      throw new PlatformError(
        "VALIDATION_ERROR",
        "Archived releases are read-only.",
        409,
      );
    }
    const allArtistIds = [
      ...new Set([...data.primaryArtistIds, ...data.featuredArtistIds]),
    ];
    transaction.update(reference, {
      title: data.title,
      type: data.type,
      releaseDate: Timestamp.fromDate(
        new Date(`${data.releaseDate}T12:00:00Z`),
      ),
      description: data.description || null,
      copyright: data.copyright || null,
      explicit: data.explicit,
      primaryArtistIds: data.primaryArtistIds,
      featuredArtistIds: data.featuredArtistIds,
      allArtistIds,
      updatedAt: Timestamp.now(),
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "release.update",
      targetType: "release",
      targetId: releaseId,
      context: { artistId },
    });
  });
}

export async function duplicateRelease(
  actor: ActiveSession,
  artistId: string,
  releaseId: string,
) {
  const permissionContext = await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "release:create",
  );
  const firestore = getFirebaseAdminFirestore();
  const sourceReference = firestore
    .collection(collections.releases)
    .doc(releaseId);
  const targetReference = firestore.collection(collections.releases).doc();
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(sourceReference);
    if (!snapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const source = snapshot.data() as ReleaseDocument;
    if (!source.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Release does not belong to this artist.",
        403,
      );
    }
    const now = Timestamp.now();
    transaction.create(targetReference, {
      ...source,
      createdByUserId: actor.user.uid,
      labelId:
        getLabelIdForArtistAction(permissionContext, "release:create") ??
        source.labelId ??
        null,
      title: `${source.title} (copy)`,
      slug: `${toSlug(source.title)}-copy-${targetReference.id.slice(0, 6)}`,
      coverUrl: null,
      coverStoragePath: null,
      status: "draft",
      durationSeconds: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      archivedAt: null,
    } satisfies ReleaseDocument);
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "release.create",
      targetType: "release",
      targetId: targetReference.id,
      context: { artistId },
      metadata: { duplicatedFrom: releaseId },
    });
  });
  return { id: targetReference.id };
}

export async function discardDraftRelease(
  actor: ActiveSession,
  artistId: string,
  releaseId: string,
) {
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "release:delete",
  );
  const firestore = getFirebaseAdminFirestore();
  const releaseReference = firestore
    .collection(collections.releases)
    .doc(releaseId);
  const trackQuery = firestore
    .collection(collections.tracks)
    .where("releaseId", "==", releaseId);
  await firestore.runTransaction(async (transaction) => {
    const [releaseSnapshot, trackSnapshot] = await Promise.all([
      transaction.get(releaseReference),
      transaction.get(trackQuery),
    ]);
    if (!releaseSnapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const release = releaseSnapshot.data() as ReleaseDocument;
    if (!release.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Release does not belong to this artist.",
        403,
      );
    }
    if (release.status !== "draft") {
      throw new PlatformError(
        "VALIDATION_ERROR",
        "Only draft releases can be discarded.",
        409,
      );
    }
    const now = Timestamp.now();
    transaction.update(releaseReference, {
      status: "archived",
      archivedAt: now,
      updatedAt: now,
    });
    trackSnapshot.docs.forEach((document) => {
      transaction.update(document.ref, { status: "archived", updatedAt: now });
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "release.archive",
      targetType: "release",
      targetId: releaseId,
      context: { artistId },
      metadata: { discardedDraft: true },
    });
  });
}

export async function createTrack(
  actor: ActiveSession,
  artistId: string,
  input: unknown,
) {
  const data = createTrackSchema.parse(input);
  if (!data.primaryArtistIds.includes(artistId)) {
    throw new PlatformError(
      "VALIDATION_ERROR",
      "The managed artist must be a primary artist.",
      400,
    );
  }
  if (!data.audioStoragePath.startsWith(`tracks/${data.trackId}/audio/`)) {
    throw new PlatformError(
      "VALIDATION_ERROR",
      "Invalid track audio storage path.",
      400,
    );
  }
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "track:create",
  );
  const firestore = getFirebaseAdminFirestore();
  const releaseReference = firestore
    .collection(collections.releases)
    .doc(data.releaseId);
  const trackReference = firestore
    .collection(collections.tracks)
    .doc(data.trackId);
  const now = Timestamp.now();
  await firestore.runTransaction(async (transaction) => {
    const [releaseSnapshot, trackSnapshot] = await Promise.all([
      transaction.get(releaseReference),
      transaction.get(trackReference),
    ]);
    if (!releaseSnapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    if (trackSnapshot.exists) {
      throw new PlatformError(
        "VALIDATION_ERROR",
        "A track with this identifier already exists.",
        409,
      );
    }
    const release = releaseSnapshot.data() as ReleaseDocument;
    if (!release.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Release does not belong to this artist.",
        403,
      );
    }
    const allArtistIds = [
      ...new Set([...data.primaryArtistIds, ...data.featuredArtistIds]),
    ];
    const track: TrackDocument = {
      title: data.title,
      slug: `${toSlug(data.title)}-${data.trackId.slice(0, 6)}`,
      releaseId: data.releaseId,
      primaryArtistIds: data.primaryArtistIds,
      secondaryArtistIds: [],
      featuredArtistIds: data.featuredArtistIds,
      allArtistIds,
      artistCredits: [
        ...data.primaryArtistIds.map((candidateId, position) => ({
          artistId: candidateId,
          role: "primary" as const,
          position,
        })),
        ...data.featuredArtistIds.map((candidateId, position) => ({
          artistId: candidateId,
          role: "featured" as const,
          position,
        })),
      ],
      durationSeconds: data.durationSeconds,
      audioUrl: data.audioUrl,
      audioStoragePath: data.audioStoragePath,
      coverUrl: null,
      coverStoragePath: null,
      trackNumber: data.trackNumber,
      explicit: data.explicit,
      categoryIds: data.categoryIds,
      tags: data.tags,
      status: "draft",
      playCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      schemaVersion: 1,
    };
    transaction.create(trackReference, track);
    transaction.update(releaseReference, {
      durationSeconds: FieldValue.increment(data.durationSeconds),
      updatedAt: now,
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "track.create",
      targetType: "track",
      targetId: data.trackId,
      context: { artistId },
      metadata: { releaseId: data.releaseId },
    });
  });
  return { id: data.trackId };
}

export async function updateTrack(
  actor: ActiveSession,
  artistId: string,
  trackIdInput: unknown,
  input: unknown,
) {
  const trackId = firestoreIdSchema.parse(trackIdInput);
  const data = updateTrackSchema.parse(input);
  if (!data.primaryArtistIds.includes(artistId)) {
    throw new PlatformError(
      "VALIDATION_ERROR",
      "The managed artist must remain a primary artist.",
      400,
    );
  }
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "track:edit",
  );
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection(collections.tracks).doc(trackId);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError("TRACK_NOT_FOUND", "Track not found.", 404);
    }
    const track = snapshot.data() as TrackDocument;
    if (!track.allArtistIds.includes(artistId) || !track.releaseId) {
      throw new PlatformError(
        "FORBIDDEN",
        "Track does not belong to this artist.",
        403,
      );
    }
    const allArtistIds = [
      ...new Set([...data.primaryArtistIds, ...data.featuredArtistIds]),
    ];
    transaction.update(reference, {
      title: data.title,
      primaryArtistIds: data.primaryArtistIds,
      featuredArtistIds: data.featuredArtistIds,
      allArtistIds,
      artistCredits: [
        ...data.primaryArtistIds.map((candidateId, position) => ({
          artistId: candidateId,
          role: "primary" as const,
          position,
        })),
        ...data.featuredArtistIds.map((candidateId, position) => ({
          artistId: candidateId,
          role: "featured" as const,
          position,
        })),
      ],
      explicit: data.explicit,
      categoryIds: data.categoryIds,
      tags: data.tags,
      updatedAt: Timestamp.now(),
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "track.update",
      targetType: "track",
      targetId: trackId,
      context: { artistId },
      metadata: { releaseId: track.releaseId },
    });
  });
}

export async function saveTrackArtwork(
  actor: ActiveSession,
  artistId: string,
  trackIdInput: unknown,
  input: unknown,
) {
  const trackId = firestoreIdSchema.parse(trackIdInput);
  const data = trackArtworkSchema.parse(input);
  if (!data.coverStoragePath.startsWith(`tracks/${trackId}/cover/`)) {
    throw new PlatformError(
      "VALIDATION_ERROR",
      "Invalid track cover storage path.",
      400,
    );
  }
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "track:edit",
  );
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection(collections.tracks).doc(trackId);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError("TRACK_NOT_FOUND", "Track not found.", 404);
    }
    const track = snapshot.data() as TrackDocument;
    if (!track.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Track does not belong to this artist.",
        403,
      );
    }
    transaction.update(reference, {
      coverUrl: data.coverUrl,
      coverStoragePath: data.coverStoragePath,
      updatedAt: Timestamp.now(),
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "track.update",
      targetType: "track",
      targetId: trackId,
      context: { artistId },
      metadata: { operation: "artwork" },
    });
  });
}

export async function reorderTracks(
  actor: ActiveSession,
  artistId: string,
  releaseIdInput: unknown,
  input: unknown,
) {
  const releaseId = firestoreIdSchema.parse(releaseIdInput);
  const { orderedTrackIds } = reorderTracksSchema.parse(input);
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "track:edit",
  );
  const firestore = getFirebaseAdminFirestore();
  const releaseReference = firestore
    .collection(collections.releases)
    .doc(releaseId);
  const trackQuery = firestore
    .collection(collections.tracks)
    .where("releaseId", "==", releaseId);
  await firestore.runTransaction(async (transaction) => {
    const [releaseSnapshot, trackSnapshot] = await Promise.all([
      transaction.get(releaseReference),
      transaction.get(trackQuery),
    ]);
    if (!releaseSnapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const release = releaseSnapshot.data() as ReleaseDocument;
    if (!release.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Release does not belong to this artist.",
        403,
      );
    }
    const existingIds = trackSnapshot.docs.map((document) => document.id);
    if (
      existingIds.length !== orderedTrackIds.length ||
      existingIds.some((id) => !orderedTrackIds.includes(id))
    ) {
      throw new PlatformError(
        "VALIDATION_ERROR",
        "The requested order must include every release track exactly once.",
        400,
      );
    }
    const byId = new Map(
      trackSnapshot.docs.map((document) => [document.id, document.ref]),
    );
    const now = Timestamp.now();
    orderedTrackIds.forEach((trackId, index) => {
      const reference = byId.get(trackId);
      if (reference) {
        transaction.update(reference, {
          trackNumber: index + 1,
          updatedAt: now,
        });
      }
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "track.update",
      targetType: "release",
      targetId: releaseId,
      context: { artistId },
      metadata: { operation: "reorder", orderedTrackIds },
    });
  });
}

export async function removeTrackFromRelease(
  actor: ActiveSession,
  artistId: string,
  trackIdInput: unknown,
) {
  const trackId = firestoreIdSchema.parse(trackIdInput);
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "track:delete",
  );
  const firestore = getFirebaseAdminFirestore();
  const trackReference = firestore.collection(collections.tracks).doc(trackId);
  await firestore.runTransaction(async (transaction) => {
    const trackSnapshot = await transaction.get(trackReference);
    if (!trackSnapshot.exists) {
      throw new PlatformError("TRACK_NOT_FOUND", "Track not found.", 404);
    }
    const track = trackSnapshot.data() as TrackDocument;
    if (!track.releaseId || !track.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Track does not belong to this artist.",
        403,
      );
    }
    if (track.status !== "draft") {
      throw new PlatformError(
        "VALIDATION_ERROR",
        "Only draft tracks can be removed. Archive the release instead.",
        409,
      );
    }
    const releaseReference = firestore
      .collection(collections.releases)
      .doc(track.releaseId);
    const releaseSnapshot = await transaction.get(releaseReference);
    if (!releaseSnapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const release = releaseSnapshot.data() as ReleaseDocument;
    transaction.update(trackReference, {
      releaseId: null,
      trackNumber: null,
      status: "archived",
      updatedAt: Timestamp.now(),
    });
    transaction.update(releaseReference, {
      durationSeconds: Math.max(
        0,
        release.durationSeconds - track.durationSeconds,
      ),
      updatedAt: Timestamp.now(),
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "track.delete",
      targetType: "track",
      targetId: trackId,
      context: { artistId },
      metadata: { releaseId: track.releaseId, softDeleted: true },
    });
  });
}

export async function publishRelease(
  actor: ActiveSession,
  artistId: string,
  releaseId: string,
) {
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "release:publish",
  );
  const firestore = getFirebaseAdminFirestore();
  const releaseReference = firestore
    .collection(collections.releases)
    .doc(releaseId);
  const trackQuery = firestore
    .collection(collections.tracks)
    .where("releaseId", "==", releaseId);
  await firestore.runTransaction(async (transaction) => {
    const [releaseSnapshot, trackSnapshot] = await Promise.all([
      transaction.get(releaseReference),
      transaction.get(trackQuery),
    ]);
    if (!releaseSnapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const release = releaseSnapshot.data() as ReleaseDocument;
    if (!release.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Release does not belong to this artist.",
        403,
      );
    }
    const tracks = trackSnapshot.docs.map(
      (snapshot) => snapshot.data() as TrackDocument,
    );
    const validationErrors = validateReleaseForPublishing(release, tracks);
    if (validationErrors.length > 0) {
      throw new PlatformError(
        "INVALID_RELEASE",
        validationErrors.join(" "),
        422,
      );
    }
    const now = Timestamp.now();
    const isScheduled = release.releaseDate.toDate().getTime() > now.toMillis();
    const nextStatus = isScheduled ? "scheduled" : "published";
    transaction.update(releaseReference, {
      status: nextStatus,
      publishedAt: isScheduled ? null : now,
      archivedAt: null,
      updatedAt: now,
      durationSeconds: tracks.reduce(
        (total, track) => total + track.durationSeconds,
        0,
      ),
    });
    for (const trackDocument of trackSnapshot.docs) {
      transaction.update(trackDocument.ref, {
        status: nextStatus,
        publishedAt: isScheduled ? null : now,
        updatedAt: now,
      });
    }
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "release.publish",
      targetType: "release",
      targetId: releaseId,
      context: { artistId },
      metadata: { status: nextStatus },
    });
  });
}

export async function archiveRelease(
  actor: ActiveSession,
  artistId: string,
  releaseId: string,
) {
  await requireArtistPermission(
    actor.user.uid,
    actor.user.claims.admin,
    artistId,
    "release:edit",
  );
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection(collections.releases).doc(releaseId);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const release = snapshot.data() as ReleaseDocument;
    if (!release.allArtistIds.includes(artistId)) {
      throw new PlatformError(
        "FORBIDDEN",
        "Release does not belong to this artist.",
        403,
      );
    }
    const now = Timestamp.now();
    transaction.update(reference, {
      status: "archived",
      archivedAt: now,
      updatedAt: now,
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "release.archive",
      targetType: "release",
      targetId: releaseId,
      context: { artistId },
    });
  });
}

export async function unpublishRelease(
  actor: ActiveSession,
  releaseId: string,
) {
  if (!actor.user.claims.admin) {
    throw new PlatformError("FORBIDDEN", "Administrator access required.", 403);
  }
  const firestore = getFirebaseAdminFirestore();
  const releaseReference = firestore
    .collection(collections.releases)
    .doc(releaseId);
  const trackQuery = firestore
    .collection(collections.tracks)
    .where("releaseId", "==", releaseId);
  await firestore.runTransaction(async (transaction) => {
    const [releaseSnapshot, trackSnapshot] = await Promise.all([
      transaction.get(releaseReference),
      transaction.get(trackQuery),
    ]);
    if (!releaseSnapshot.exists) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const release = releaseSnapshot.data() as ReleaseDocument;
    if (!release.primaryArtistIds[0]) {
      throw new PlatformError(
        "INVALID_RELEASE",
        "The release has no primary artist.",
        422,
      );
    }
    const now = Timestamp.now();
    transaction.update(releaseReference, {
      status: "draft",
      publishedAt: null,
      archivedAt: null,
      updatedAt: now,
    });
    trackSnapshot.docs.forEach((document) => {
      transaction.update(document.ref, {
        status: "draft",
        publishedAt: null,
        updatedAt: now,
      });
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "release.unpublish",
      targetType: "release",
      targetId: releaseId,
      context: { artistId: release.primaryArtistIds[0] },
    });
  });
}
