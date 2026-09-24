import type {
  ArtistMembershipRole,
  ArtistMembershipStatus,
  ArtistPermissions,
  LabelArtistPermissions,
  LabelMembershipRole,
  LabelMembershipStatus,
  LabelPermissions,
  SubscriptionPlan,
  SubscriptionStatus,
  UserCapabilities,
} from "@/types/platform";

export type TimestampLike = {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
};

export type LegacyUserRole = "listener" | "artist" | "admin";
export type AccountStatus = "active" | "suspended" | "deleted";
export type CatalogStatus = "draft" | "scheduled" | "published" | "archived";
export type ArtistClaimStatus = "unclaimed" | "claimed";
export type ApplicationType =
  "artist_claim" | "artist_creation" | "label_creation";
export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "needs_information"
  | "approved"
  | "rejected"
  | "cancelled";

export type UserDocument = {
  uid: string;
  username: string | null;
  usernameNormalized: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  /** Kept temporarily so existing profiles can be migrated without downtime. */
  role?: LegacyUserRole;
  capabilities: UserCapabilities;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  accountStatus: AccountStatus;
  onboardingCompleted: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  lastLoginAt: TimestampLike;
  schemaVersion: 1;
};

export type UsernameDocument = {
  uid: string;
  createdAt: TimestampLike;
};

export type ArtistCreditDocument = {
  artistId: string;
  role: "primary" | "secondary" | "featured";
  position: number;
};

export type ArtistDocument = {
  name: string;
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  avatarStoragePath: string | null;
  bannerStoragePath: string | null;
  bio: string;
  verified: boolean;
  status: "active" | "pending" | "suspended" | "archived";
  claimStatus: ArtistClaimStatus;
  monthlyListeners: number;
  followerCount: number;
  categoryIds: string[];
  links: { label: string; url: string }[];
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  schemaVersion: 1;
};

export type TrackDocument = {
  title: string;
  slug: string;
  releaseId: string | null;
  primaryArtistIds: string[];
  secondaryArtistIds: string[];
  featuredArtistIds: string[];
  allArtistIds: string[];
  artistCredits: ArtistCreditDocument[];
  durationSeconds: number;
  audioUrl: string | null;
  audioStoragePath: string | null;
  coverUrl: string | null;
  coverStoragePath: string | null;
  trackNumber: number | null;
  explicit: boolean;
  categoryIds: string[];
  tags: string[];
  status: CatalogStatus;
  playCount: number;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  publishedAt: TimestampLike | null;
  schemaVersion: 1;
};

export type ReleaseDocument = {
  /** Actor that first created the release. Added progressively to legacy data. */
  createdByUserId?: string;
  /** Label context used at creation, when the actor managed the artist via a label. */
  labelId?: string | null;
  title: string;
  slug: string;
  type: "single" | "ep" | "album";
  primaryArtistIds: string[];
  featuredArtistIds: string[];
  allArtistIds: string[];
  coverUrl: string | null;
  coverStoragePath: string | null;
  description: string | null;
  releaseDate: TimestampLike;
  status: CatalogStatus;
  copyright: string | null;
  explicit: boolean;
  durationSeconds: number;
  tags: string[];
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  publishedAt: TimestampLike | null;
  archivedAt: TimestampLike | null;
  schemaVersion: 1;
};

export type PlaylistDocument = {
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  creator: {
    type: "official" | "user";
    id: string;
    name: string;
  };
  trackIds: string[];
  visibility: "public" | "private" | "unlisted";
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  schemaVersion: 1;
};

export type CategoryDocument = {
  name: string;
  slug: string;
  description: string;
  artworkUrl: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  schemaVersion: 1;
};

export type ArtistMembershipDocument = {
  userId: string;
  artistId: string;
  role: ArtistMembershipRole;
  /** Legacy materialized preset. New authorization derives from role. */
  permissions?: ArtistPermissions;
  permissionOverrides?: Partial<ArtistPermissions>;
  status: ArtistMembershipStatus;
  invitedBy: string | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  schemaVersion: 1;
};

export type LabelDocument = {
  name: string;
  slug: string;
  logoUrl: string | null;
  logoStoragePath: string | null;
  bannerUrl: string | null;
  bannerStoragePath: string | null;
  description: string | null;
  websiteUrl: string | null;
  verified: boolean;
  status: "active" | "pending" | "suspended" | "archived";
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  schemaVersion: 1;
};

export type LabelMembershipDocument = {
  userId: string;
  labelId: string;
  role: LabelMembershipRole;
  /** Legacy materialized preset. New authorization derives from role. */
  permissions?: LabelPermissions;
  permissionOverrides?: Partial<LabelPermissions>;
  status: LabelMembershipStatus;
  invitedBy: string | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  schemaVersion: 1;
};

export type LabelArtistRelationDocument = {
  labelId: string;
  artistId: string;
  status: "active" | "pending" | "ended";
  permissions: LabelArtistPermissions;
  joinedAt: TimestampLike;
  endedAt: TimestampLike | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  schemaVersion: 1;
};

export type InvitationDocument = {
  type: "artist" | "label";
  targetId: string;
  email: string;
  role: ArtistMembershipRole | LabelMembershipRole;
  invitedBy: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  createdAt: TimestampLike;
  expiresAt: TimestampLike;
  schemaVersion: 1;
};

export type ApplicationEvidence = {
  websiteUrl?: string;
  socialUrls?: string[];
  contactEmail?: string;
};

export type RequestedArtistDocument = {
  name: string;
  biography?: string;
  websiteUrl?: string;
  socialUrls?: string[];
  categoryIds?: string[];
};

export type RequestedLabelDocument = {
  name: string;
  websiteUrl?: string;
  socialUrls?: string[];
  description?: string;
};

export type ApplicationDocument = {
  type: ApplicationType;
  applicantUserId: string;
  status: ApplicationStatus;
  artistId?: string;
  labelId?: string;
  evidence?: ApplicationEvidence;
  requestedArtist?: RequestedArtistDocument;
  requestedLabel?: RequestedLabelDocument;
  representativeRole?: string;
  message: string | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  reviewedAt: TimestampLike | null;
  reviewedByUserId: string | null;
  adminNote: string | null;
  messageToApplicant: string | null;
  resolutionReason: string | null;
  schemaVersion: 1;
};

export type ApplicationMessageDocument = {
  authorType: "applicant" | "admin";
  authorUserId: string;
  message: string;
  createdAt: TimestampLike;
};

export type ArtistOwnershipDocument = {
  artistId: string;
  ownerUserId: string;
  ownerMembershipId: string;
  claimApplicationId: string | null;
  claimedAt: TimestampLike;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  schemaVersion: 1;
};

export type AuditTargetType =
  | "user"
  | "artist"
  | "label"
  | "release"
  | "track"
  | "playlist"
  | "membership"
  | "application";

export type AuditLogDocument = {
  actorUserId: string;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  context: { artistId?: string; labelId?: string };
  metadata?: Record<string, unknown>;
  createdAt: TimestampLike;
};
