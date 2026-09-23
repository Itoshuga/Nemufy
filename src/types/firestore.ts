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
  permissions: ArtistPermissions;
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
  permissions: LabelPermissions;
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

export type AuditTargetType =
  "user" | "artist" | "label" | "release" | "track" | "playlist" | "membership";

export type AuditLogDocument = {
  actorUserId: string;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  context: { artistId?: string; labelId?: string };
  metadata?: Record<string, unknown>;
  createdAt: TimestampLike;
};
