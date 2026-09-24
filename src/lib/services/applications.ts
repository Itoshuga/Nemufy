import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { ActiveSession } from "@/lib/firebase/auth/server";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import {
  applicationSubcollections,
  collections,
} from "@/lib/firebase/firestore/collections";
import { createAuditLogInTransaction } from "@/lib/firebase/firestore/repositories/audit-logs";
import { artistMembershipId } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { labelMembershipId } from "@/lib/firebase/firestore/repositories/label-memberships";
import { PlatformError, forbidden } from "@/lib/errors/platform-error";
import {
  adminApplicationActionSchema,
  applicantApplicationActionSchema,
  submitApplicationSchema,
  type SubmitApplicationInput,
} from "@/lib/validation/applications";
import { toSlug } from "@/lib/validation/platform";
import type {
  ApplicationDocument,
  ApplicationMessageDocument,
  ApplicationStatus,
  ArtistDocument,
  ArtistMembershipDocument,
  ArtistOwnershipDocument,
  LabelDocument,
  LabelMembershipDocument,
  UserDocument,
} from "@/types/firestore";

const activeApplicationStatuses: ApplicationStatus[] = [
  "pending",
  "under_review",
  "needs_information",
];

function assertAdmin(actor: ActiveSession) {
  if (!actor.user.claims.admin) throw forbidden();
}

function assertReviewable(application: ApplicationDocument) {
  if (!activeApplicationStatuses.includes(application.status)) {
    throw new PlatformError(
      "APPLICATION_CONFLICT",
      "This application has already been completed.",
      409,
    );
  }
}

function applicationMessage(
  authorType: ApplicationMessageDocument["authorType"],
  authorUserId: string,
  message: string,
): ApplicationMessageDocument {
  return {
    authorType,
    authorUserId,
    message,
    createdAt: Timestamp.now(),
  };
}

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function applicationData(
  actor: ActiveSession,
  input: SubmitApplicationInput,
): ApplicationDocument {
  const now = Timestamp.now();
  const base = {
    type: input.type,
    applicantUserId: actor.user.uid,
    status: "pending" as const,
    message: normalizeOptional(input.message) ?? null,
    createdAt: now,
    updatedAt: now,
    reviewedAt: null,
    reviewedByUserId: null,
    adminNote: null,
    messageToApplicant: null,
    resolutionReason: null,
    schemaVersion: 1 as const,
  };
  if (input.type === "artist_claim") {
    return {
      ...base,
      artistId: input.artistId,
      evidence: {
        ...(normalizeOptional(input.websiteUrl)
          ? { websiteUrl: normalizeOptional(input.websiteUrl) }
          : {}),
        ...(input.socialUrls.length > 0
          ? { socialUrls: input.socialUrls }
          : {}),
        ...(normalizeOptional(input.contactEmail)
          ? { contactEmail: normalizeOptional(input.contactEmail) }
          : {}),
      },
    };
  }
  if (input.type === "artist_creation") {
    return {
      ...base,
      requestedArtist: {
        name: input.name,
        ...(normalizeOptional(input.biography)
          ? { biography: normalizeOptional(input.biography) }
          : {}),
        ...(normalizeOptional(input.websiteUrl)
          ? { websiteUrl: normalizeOptional(input.websiteUrl) }
          : {}),
        ...(input.socialUrls.length > 0
          ? { socialUrls: input.socialUrls }
          : {}),
        ...(input.categoryIds.length > 0
          ? { categoryIds: input.categoryIds }
          : {}),
      },
    };
  }
  return {
    ...base,
    requestedLabel: {
      name: input.name,
      ...(normalizeOptional(input.websiteUrl)
        ? { websiteUrl: normalizeOptional(input.websiteUrl) }
        : {}),
      ...(input.socialUrls.length > 0
        ? { socialUrls: input.socialUrls }
        : {}),
      ...(normalizeOptional(input.description)
        ? { description: normalizeOptional(input.description) }
        : {}),
    },
    ...(normalizeOptional(input.representativeRole)
      ? { representativeRole: normalizeOptional(input.representativeRole) }
      : {}),
  };
}

export async function submitApplication(
  actor: ActiveSession,
  input: unknown,
) {
  const data = submitApplicationSchema.parse(input);
  const firestore = getFirebaseAdminFirestore();
  const applicationReference = firestore
    .collection(collections.applications)
    .doc();

  await firestore.runTransaction(async (transaction) => {
    let duplicateQuery: FirebaseFirestore.Query = firestore
      .collection(collections.applications)
      .where("applicantUserId", "==", actor.user.uid)
      .where("type", "==", data.type)
      .where("status", "in", activeApplicationStatuses);

    const reads: Array<Promise<FirebaseFirestore.DocumentSnapshot | FirebaseFirestore.QuerySnapshot>> = [
      transaction.get(duplicateQuery),
    ];
    let artistReference: FirebaseFirestore.DocumentReference | undefined;
    let ownershipReference: FirebaseFirestore.DocumentReference | undefined;
    if (data.type === "artist_claim") {
      duplicateQuery = duplicateQuery.where("artistId", "==", data.artistId);
      reads[0] = transaction.get(duplicateQuery);
      artistReference = firestore
        .collection(collections.artists)
        .doc(data.artistId);
      ownershipReference = firestore
        .collection(collections.artistOwnerships)
        .doc(data.artistId);
      reads.push(
        transaction.get(artistReference),
        transaction.get(ownershipReference),
      );
    }
    const results = await Promise.all(reads);
    const duplicateSnapshot = results[0] as FirebaseFirestore.QuerySnapshot;
    if (!duplicateSnapshot.empty) {
      throw new PlatformError(
        "APPLICATION_CONFLICT",
        "You already have an active application of this type.",
        409,
      );
    }
    if (data.type === "artist_claim") {
      const artistSnapshot = results[1] as FirebaseFirestore.DocumentSnapshot;
      const ownershipSnapshot = results[2] as FirebaseFirestore.DocumentSnapshot;
      if (!artistSnapshot.exists) {
        throw new PlatformError("ARTIST_NOT_FOUND", "Artist not found.", 404);
      }
      if (
        artistSnapshot.get("claimStatus") === "claimed" ||
        ownershipSnapshot.exists
      ) {
        throw new PlatformError(
          "ARTIST_ALREADY_CLAIMED",
          "This artist profile has already been claimed.",
          409,
        );
      }
    }
    transaction.create(applicationReference, applicationData(actor, data));
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "application.submit",
      targetType: "application",
      targetId: applicationReference.id,
      context: data.type === "artist_claim" ? { artistId: data.artistId } : {},
      metadata: { type: data.type },
    });
  });
  return { id: applicationReference.id };
}

export async function updateOwnApplication(
  actor: ActiveSession,
  applicationId: string,
  input: unknown,
) {
  const data = applicantApplicationActionSchema.parse(input);
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore
    .collection(collections.applications)
    .doc(applicationId);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError(
        "APPLICATION_NOT_FOUND",
        "Application not found.",
        404,
      );
    }
    const application = snapshot.data() as ApplicationDocument;
    if (application.applicantUserId !== actor.user.uid) throw forbidden();
    assertReviewable(application);
    const now = Timestamp.now();
    if (data.action === "cancel") {
      transaction.update(reference, {
        status: "cancelled",
        updatedAt: now,
        reviewedAt: now,
        reviewedByUserId: actor.user.uid,
        resolutionReason: "cancelled_by_applicant",
      });
      createAuditLogInTransaction(transaction, {
        actorUserId: actor.user.uid,
        action: "application.cancel",
        targetType: "application",
        targetId: applicationId,
        context: application.artistId
          ? { artistId: application.artistId }
          : {},
      });
      return;
    }
    if (application.status !== "needs_information") {
      throw new PlatformError(
        "APPLICATION_CONFLICT",
        "This application is not waiting for more information.",
        409,
      );
    }
    const messageReference = reference
      .collection(applicationSubcollections.messages)
      .doc();
    transaction.create(
      messageReference,
      applicationMessage("applicant", actor.user.uid, data.message),
    );
    transaction.update(reference, {
      status: "under_review",
      updatedAt: now,
      messageToApplicant: null,
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "application.respond",
      targetType: "application",
      targetId: applicationId,
      context: application.artistId ? { artistId: application.artistId } : {},
    });
  });
}

export async function reviewApplication(
  actor: ActiveSession,
  applicationId: string,
  input: unknown,
) {
  assertAdmin(actor);
  const data = adminApplicationActionSchema.parse(input);
  if (data.action === "approve") {
    return approveApplication(actor, applicationId);
  }
  if (data.action === "link_existing") {
    return linkApplicationToExistingArtist(
      actor,
      applicationId,
      data.artistId,
    );
  }
  const firestore = getFirebaseAdminFirestore();
  const reference = firestore
    .collection(collections.applications)
    .doc(applicationId);
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new PlatformError(
        "APPLICATION_NOT_FOUND",
        "Application not found.",
        404,
      );
    }
    const application = snapshot.data() as ApplicationDocument;
    assertReviewable(application);
    const now = Timestamp.now();
    if (data.action === "start_review") {
      transaction.update(reference, {
        status: "under_review",
        reviewedByUserId: actor.user.uid,
        updatedAt: now,
      });
      createAuditLogInTransaction(transaction, {
        actorUserId: actor.user.uid,
        action: "application.review-start",
        targetType: "application",
        targetId: applicationId,
        context: application.artistId
          ? { artistId: application.artistId }
          : {},
      });
      return;
    }
    const messageReference = reference
      .collection(applicationSubcollections.messages)
      .doc();
    transaction.create(
      messageReference,
      applicationMessage("admin", actor.user.uid, data.message),
    );
    if (data.action === "request_information") {
      transaction.update(reference, {
        status: "needs_information",
        reviewedByUserId: actor.user.uid,
        messageToApplicant: data.message,
        updatedAt: now,
      });
      createAuditLogInTransaction(transaction, {
        actorUserId: actor.user.uid,
        action: "application.request-information",
        targetType: "application",
        targetId: applicationId,
        context: application.artistId
          ? { artistId: application.artistId }
          : {},
      });
      return;
    }
    transaction.update(reference, {
      status: "rejected",
      reviewedAt: now,
      reviewedByUserId: actor.user.uid,
      adminNote: data.adminNote || null,
      messageToApplicant: data.message,
      resolutionReason: data.reason,
      updatedAt: now,
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "application.reject",
      targetType: "application",
      targetId: applicationId,
      context: application.artistId ? { artistId: application.artistId } : {},
      metadata: { reason: data.reason },
    });
  });
  return { id: applicationId };
}

async function linkApplicationToExistingArtist(
  actor: ActiveSession,
  applicationId: string,
  artistId: string,
) {
  const firestore = getFirebaseAdminFirestore();
  const applicationReference = firestore
    .collection(collections.applications)
    .doc(applicationId);
  const artistReference = firestore.collection(collections.artists).doc(artistId);
  const ownershipReference = firestore
    .collection(collections.artistOwnerships)
    .doc(artistId);
  await firestore.runTransaction(async (transaction) => {
    const [applicationSnapshot, artistSnapshot, ownershipSnapshot] =
      await Promise.all([
        transaction.get(applicationReference),
        transaction.get(artistReference),
        transaction.get(ownershipReference),
      ]);
    if (!applicationSnapshot.exists) {
      throw new PlatformError(
        "APPLICATION_NOT_FOUND",
        "Application not found.",
        404,
      );
    }
    const application = applicationSnapshot.data() as ApplicationDocument;
    assertReviewable(application);
    if (application.type !== "artist_creation") {
      throw new PlatformError(
        "APPLICATION_CONFLICT",
        "Only a new artist application can be linked to an existing artist.",
        409,
      );
    }
    if (!artistSnapshot.exists) {
      throw new PlatformError("ARTIST_NOT_FOUND", "Artist not found.", 404);
    }
    if (
      artistSnapshot.get("claimStatus") === "claimed" ||
      ownershipSnapshot.exists
    ) {
      throw new PlatformError(
        "ARTIST_ALREADY_CLAIMED",
        "This artist profile has already been claimed.",
        409,
      );
    }
    const duplicateSnapshot = await transaction.get(
      firestore
        .collection(collections.applications)
        .where("applicantUserId", "==", application.applicantUserId)
        .where("type", "==", "artist_claim")
        .where("artistId", "==", artistId)
        .where("status", "in", activeApplicationStatuses),
    );
    if (!duplicateSnapshot.empty) {
      throw new PlatformError(
        "APPLICATION_CONFLICT",
        "The applicant already has an active claim for this artist.",
        409,
      );
    }
    const requestedArtist = application.requestedArtist;
    transaction.update(applicationReference, {
      type: "artist_claim",
      artistId,
      evidence: {
        ...(requestedArtist?.websiteUrl
          ? { websiteUrl: requestedArtist.websiteUrl }
          : {}),
        ...(requestedArtist?.socialUrls?.length
          ? { socialUrls: requestedArtist.socialUrls }
          : {}),
      },
      requestedArtist: FieldValue.delete(),
      status: "under_review",
      reviewedByUserId: actor.user.uid,
      updatedAt: Timestamp.now(),
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "application.link-existing-artist",
      targetType: "application",
      targetId: applicationId,
      context: { artistId },
    });
  });
  return { id: applicationId };
}

async function approveApplication(
  actor: ActiveSession,
  applicationId: string,
) {
  const firestore = getFirebaseAdminFirestore();
  const applicationReference = firestore
    .collection(collections.applications)
    .doc(applicationId);
  const initialSnapshot = await applicationReference.get();
  if (!initialSnapshot.exists) {
    throw new PlatformError(
      "APPLICATION_NOT_FOUND",
      "Application not found.",
      404,
    );
  }
  const initialApplication = initialSnapshot.data() as ApplicationDocument;
  if (initialApplication.type === "label_creation") {
    return approveLabelCreation(actor, applicationReference);
  }
  return approveArtistApplication(actor, applicationReference);
}

async function approveArtistApplication(
  actor: ActiveSession,
  applicationReference: FirebaseFirestore.DocumentReference,
) {
  const firestore = getFirebaseAdminFirestore();
  const newArtistReference = firestore.collection(collections.artists).doc();
  let approvedArtistId = "";
  await firestore.runTransaction(async (transaction) => {
    const applicationSnapshot = await transaction.get(applicationReference);
    if (!applicationSnapshot.exists) {
      throw new PlatformError(
        "APPLICATION_NOT_FOUND",
        "Application not found.",
        404,
      );
    }
    const application = applicationSnapshot.data() as ApplicationDocument;
    assertReviewable(application);
    if (
      application.type !== "artist_claim" &&
      application.type !== "artist_creation"
    ) {
      throw new PlatformError(
        "APPLICATION_CONFLICT",
        "This is not an artist application.",
        409,
      );
    }
    const artistId =
      application.type === "artist_claim"
        ? application.artistId
        : newArtistReference.id;
    if (!artistId) {
      throw new PlatformError(
        "APPLICATION_CONFLICT",
        "The artist claim has no target.",
        409,
      );
    }
    approvedArtistId = artistId;
    const artistReference = firestore.collection(collections.artists).doc(artistId);
    const ownershipReference = firestore
      .collection(collections.artistOwnerships)
      .doc(artistId);
    const userReference = firestore
      .collection(collections.users)
      .doc(application.applicantUserId);
    const membershipQuery = firestore
      .collection(collections.artistMemberships)
      .where("userId", "==", application.applicantUserId)
      .where("artistId", "==", artistId)
      .limit(1);
    const competingClaimsQuery = firestore
      .collection(collections.applications)
      .where("type", "==", "artist_claim")
      .where("artistId", "==", artistId)
      .where("status", "in", activeApplicationStatuses);
    const [artistSnapshot, ownershipSnapshot, userSnapshot, membershipSnapshot, competingClaims] =
      await Promise.all([
        transaction.get(artistReference),
        transaction.get(ownershipReference),
        transaction.get(userReference),
        transaction.get(membershipQuery),
        transaction.get(competingClaimsQuery),
      ]);
    if (!userSnapshot.exists) {
      throw new PlatformError("USER_NOT_FOUND", "Applicant not found.", 404);
    }
    if (application.type === "artist_claim") {
      if (!artistSnapshot.exists) {
        throw new PlatformError("ARTIST_NOT_FOUND", "Artist not found.", 404);
      }
      if (
        artistSnapshot.get("claimStatus") === "claimed" ||
        ownershipSnapshot.exists
      ) {
        throw new PlatformError(
          "ARTIST_ALREADY_CLAIMED",
          "This artist profile has already been claimed.",
          409,
        );
      }
    } else {
      const requested = application.requestedArtist;
      if (!requested) {
        throw new PlatformError(
          "APPLICATION_CONFLICT",
          "The requested artist details are missing.",
          409,
        );
      }
      const links = [
        ...(requested.websiteUrl
          ? [{ label: "Website", url: requested.websiteUrl }]
          : []),
        ...(requested.socialUrls ?? []).map((url, index) => ({
          label: `Social ${index + 1}`,
          url,
        })),
      ];
      const now = Timestamp.now();
      const artist: ArtistDocument = {
        name: requested.name,
        displayName: requested.name,
        slug: `${toSlug(requested.name)}-${artistId.slice(0, 6)}`,
        avatarUrl: null,
        bannerUrl: null,
        avatarStoragePath: null,
        bannerStoragePath: null,
        bio: requested.biography ?? "",
        verified: false,
        status: "active",
        claimStatus: "claimed",
        monthlyListeners: 0,
        followerCount: 0,
        categoryIds: requested.categoryIds ?? [],
        links,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      };
      transaction.create(artistReference, artist);
    }
    const now = Timestamp.now();
    const existingMembership = membershipSnapshot.docs[0];
    const membershipReference =
      existingMembership?.ref ??
      firestore
        .collection(collections.artistMemberships)
        .doc(artistMembershipId(application.applicantUserId, artistId));
    const existingMembershipData = existingMembership?.data() as
      | ArtistMembershipDocument
      | undefined;
    const membership: ArtistMembershipDocument = {
      userId: application.applicantUserId,
      artistId,
      role: "owner",
      permissionOverrides: existingMembershipData?.permissionOverrides ?? {},
      status: "active",
      invitedBy: existingMembershipData?.invitedBy ?? actor.user.uid,
      createdAt: existingMembershipData?.createdAt ?? now,
      updatedAt: now,
      schemaVersion: 1,
    };
    transaction.set(membershipReference, membership);
    const ownership: ArtistOwnershipDocument = {
      artistId,
      ownerUserId: application.applicantUserId,
      ownerMembershipId: membershipReference.id,
      claimApplicationId: applicationReference.id,
      claimedAt: now,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    transaction.create(ownershipReference, ownership);
    transaction.update(artistReference, {
      claimStatus: "claimed",
      updatedAt: now,
    });
    const applicant = userSnapshot.data() as UserDocument;
    transaction.update(userReference, {
      capabilities: {
        artist: true,
        label: applicant.capabilities?.label === true,
        admin: applicant.capabilities?.admin === true,
      },
      updatedAt: now,
    });
    transaction.update(applicationReference, {
      status: "approved",
      artistId,
      reviewedAt: now,
      reviewedByUserId: actor.user.uid,
      messageToApplicant: "Your application has been approved.",
      resolutionReason: null,
      updatedAt: now,
    });
    for (const competing of competingClaims.docs) {
      if (competing.id === applicationReference.id) continue;
      transaction.update(competing.ref, {
        status: "rejected",
        reviewedAt: now,
        reviewedByUserId: actor.user.uid,
        messageToApplicant:
          "This artist profile has been claimed through another verified application.",
        resolutionReason: "artist_already_claimed",
        updatedAt: now,
      });
    }
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "application.approve",
      targetType: "application",
      targetId: applicationReference.id,
      context: { artistId },
      metadata: { type: application.type },
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action:
        application.type === "artist_claim"
          ? "artist.claim"
          : "artist.create-from-application",
      targetType: "artist",
      targetId: artistId,
      context: { artistId },
      metadata: { applicationId: applicationReference.id },
    });
  });
  return { id: applicationReference.id, artistId: approvedArtistId };
}

async function approveLabelCreation(
  actor: ActiveSession,
  applicationReference: FirebaseFirestore.DocumentReference,
) {
  const firestore = getFirebaseAdminFirestore();
  const labelReference = firestore.collection(collections.labels).doc();
  await firestore.runTransaction(async (transaction) => {
    const applicationSnapshot = await transaction.get(applicationReference);
    if (!applicationSnapshot.exists) {
      throw new PlatformError(
        "APPLICATION_NOT_FOUND",
        "Application not found.",
        404,
      );
    }
    const application = applicationSnapshot.data() as ApplicationDocument;
    assertReviewable(application);
    if (application.type !== "label_creation" || !application.requestedLabel) {
      throw new PlatformError(
        "APPLICATION_CONFLICT",
        "The requested label details are missing.",
        409,
      );
    }
    const userReference = firestore
      .collection(collections.users)
      .doc(application.applicantUserId);
    const userSnapshot = await transaction.get(userReference);
    if (!userSnapshot.exists) {
      throw new PlatformError("USER_NOT_FOUND", "Applicant not found.", 404);
    }
    const now = Timestamp.now();
    const requested = application.requestedLabel;
    const label: LabelDocument = {
      name: requested.name,
      slug: `${toSlug(requested.name)}-${labelReference.id.slice(0, 6)}`,
      logoUrl: null,
      logoStoragePath: null,
      bannerUrl: null,
      bannerStoragePath: null,
      description: requested.description ?? null,
      websiteUrl: requested.websiteUrl ?? null,
      verified: false,
      status: "active",
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    const membershipReference = firestore
      .collection(collections.labelMemberships)
      .doc(labelMembershipId(application.applicantUserId, labelReference.id));
    const membership: LabelMembershipDocument = {
      userId: application.applicantUserId,
      labelId: labelReference.id,
      role: "owner",
      permissionOverrides: {},
      status: "active",
      invitedBy: actor.user.uid,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    const applicant = userSnapshot.data() as UserDocument;
    transaction.create(labelReference, label);
    transaction.create(membershipReference, membership);
    transaction.update(userReference, {
      capabilities: {
        artist: applicant.capabilities?.artist === true,
        label: true,
        admin: applicant.capabilities?.admin === true,
      },
      updatedAt: now,
    });
    transaction.update(applicationReference, {
      status: "approved",
      reviewedAt: now,
      reviewedByUserId: actor.user.uid,
      messageToApplicant: "Your label application has been approved.",
      resolutionReason: null,
      updatedAt: now,
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "application.approve",
      targetType: "application",
      targetId: applicationReference.id,
      context: { labelId: labelReference.id },
      metadata: { type: application.type },
    });
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "label.create-from-application",
      targetType: "label",
      targetId: labelReference.id,
      context: { labelId: labelReference.id },
      metadata: { applicationId: applicationReference.id },
    });
  });
  return { id: applicationReference.id, labelId: labelReference.id };
}

export async function releaseArtistOwnership(
  actor: ActiveSession,
  artistId: string,
) {
  assertAdmin(actor);
  const firestore = getFirebaseAdminFirestore();
  const ownershipReference = firestore
    .collection(collections.artistOwnerships)
    .doc(artistId);
  const artistReference = firestore.collection(collections.artists).doc(artistId);
  await firestore.runTransaction(async (transaction) => {
    const [ownershipSnapshot, artistSnapshot] = await Promise.all([
      transaction.get(ownershipReference),
      transaction.get(artistReference),
    ]);
    if (!artistSnapshot.exists) {
      throw new PlatformError("ARTIST_NOT_FOUND", "Artist not found.", 404);
    }
    if (!ownershipSnapshot.exists) {
      throw new PlatformError(
        "APPLICATION_CONFLICT",
        "This artist has no active ownership.",
        409,
      );
    }
    const ownership = ownershipSnapshot.data() as ArtistOwnershipDocument;
    const membershipReference = firestore
      .collection(collections.artistMemberships)
      .doc(ownership.ownerMembershipId);
    const userReference = firestore
      .collection(collections.users)
      .doc(ownership.ownerUserId);
    const otherMembershipsQuery = firestore
      .collection(collections.artistMemberships)
      .where("userId", "==", ownership.ownerUserId)
      .where("status", "==", "active");
    const [membershipSnapshot, userSnapshot, activeMemberships] =
      await Promise.all([
        transaction.get(membershipReference),
        transaction.get(userReference),
        transaction.get(otherMembershipsQuery),
      ]);
    const now = Timestamp.now();
    if (membershipSnapshot.exists) {
      transaction.update(membershipReference, {
        status: "revoked",
        updatedAt: now,
      });
    }
    transaction.delete(ownershipReference);
    transaction.update(artistReference, {
      claimStatus: "unclaimed",
      updatedAt: now,
    });
    if (userSnapshot.exists) {
      const user = userSnapshot.data() as UserDocument;
      const hasAnotherArtist = activeMemberships.docs.some(
        (document) => document.id !== ownership.ownerMembershipId,
      );
      transaction.update(userReference, {
        capabilities: {
          artist: hasAnotherArtist,
          label: user.capabilities?.label === true,
          admin: user.capabilities?.admin === true,
        },
        updatedAt: now,
      });
    }
    createAuditLogInTransaction(transaction, {
      actorUserId: actor.user.uid,
      action: "artist.ownership.release",
      targetType: "artist",
      targetId: artistId,
      context: { artistId },
      metadata: { previousOwnerUserId: ownership.ownerUserId },
    });
  });
}

export { activeApplicationStatuses };
