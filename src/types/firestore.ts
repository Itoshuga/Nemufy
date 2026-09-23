export type TimestampLike = {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
};

export type UserRole = "listener" | "artist" | "admin";
export type AccountStatus = "active" | "suspended" | "deleted";
export type CatalogStatus = "draft" | "published" | "archived";

export type UserDocument = {
  uid: string;
  username: string | null;
  usernameNormalized: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
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
  bio: string;
  verified: boolean;
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
  audioUrl: string;
  coverUrl: string | null;
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
  coverUrl: string;
  description: string | null;
  releaseDate: TimestampLike;
  status: CatalogStatus;
  copyright: string | null;
  explicit: boolean;
  durationSeconds: number;
  tags: string[];
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
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
  role: "owner" | "manager" | "editor";
  status: "active" | "pending";
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  schemaVersion: 1;
};
