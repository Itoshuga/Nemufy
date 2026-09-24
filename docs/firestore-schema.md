# Firestore schema — roles, studios and administration

Nemufy separates authentication identities, artist identities and label organizations. A Firebase Auth user never doubles as an artist or label document.

```text
Firebase Auth user
       │
       ├── users/{uid}
       ├── artistMemberships/{uid}_{artistId} ── artists/{artistId}
       └── labelMemberships/{uid}_{labelId} ─── labels/{labelId}
                                                     │
                                                     └── labelArtists/{labelId}_{artistId}
                                                               │
                                                               └── artists/{artistId}
```

The deterministic membership IDs are an authorization optimization: Firebase Storage Rules can verify a precise membership with one document lookup. Repository queries still use `userId`, `artistId`, `labelId` and `status`, so the relationship itself remains explicit.

## `users/{uid}`

Existing identity fields remain. Authorization and billing concepts are separate:

```ts
{
  uid: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  accountStatus: "active" | "suspended" | "deleted"
  onboardingCompleted: boolean
  capabilities: {
    artist: boolean // legacy provisioning flag; not an authorization source
    label: boolean // legacy provisioning flag; not an authorization source
    admin: boolean
  }
  subscriptionPlan: "free" | "premium"
  subscriptionStatus:
    | "active"
    | "inactive"
    | "trialing"
    | "past_due"
    | "cancelled"
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLoginAt: Timestamp
  schemaVersion: 1
}
```

The legacy singular `role` is read only as a migration fallback and is no longer written.

## `artists/{artistId}`

Artists exist independently of users and labels.

```ts
{
  name: string
  displayName: string
  slug: string
  avatarUrl: string | null
  avatarStoragePath: string | null
  bannerUrl: string | null
  bannerStoragePath: string | null
  bio: string
  verified: boolean
  status: "active" | "pending" | "suspended" | "archived"
  monthlyListeners: number
  followerCount: number
  categoryIds: string[]
  links: { label: string; url: string }[]
  createdAt: Timestamp
  updatedAt: Timestamp
  schemaVersion: 1
}
```

## `artistMemberships/{uid}_{artistId}`

```ts
{
  userId: string;
  artistId: string;
  role: "owner" | "manager" | "editor" | "viewer";
  permissionOverrides?: Partial<ArtistPermissions>;
  status: "active" | "pending" | "revoked";
  invitedBy: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: 1;
}
```

Role presets live in `src/lib/permissions/presets.ts` and are the default source of truth. `permissionOverrides` is optional and stores only intentional exceptions. The legacy materialized `permissions` field is read during migration but is no longer written.

## `labels/{labelId}`

```ts
{
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: 1;
}
```

## `labelMemberships/{uid}_{labelId}`

The roles are `owner`, `admin`, `manager`, `editor` and `viewer`. Central presets define `manageLabel`, `manageArtists`, `manageReleases`, `manageTracks`, `publish`, `manageTeam` and `viewAnalytics`; an optional `permissionOverrides` map contains only deliberate exceptions.

## `labelArtists/{labelId}_{artistId}`

This is a first-class relationship, not an array on the label:

```ts
{
  labelId: string;
  artistId: string;
  status: "active" | "pending" | "ended";
  permissions: {
    manageProfile: boolean;
    manageReleases: boolean;
    manageTracks: boolean;
    publish: boolean;
  }
  joinedAt: Timestamp;
  endedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: 1;
}
```

An artist created by a label receives an active relation without requiring a user. Linking an existing artist starts as `pending`.

## `releases/{releaseId}` and `tracks/{trackId}`

Releases support `draft`, `scheduled`, `published` and `archived`. New records also store `createdByUserId` and, when created through a label relationship, `labelId`. These fields are optional while older documents are migrated. Covers store both `coverUrl` and `coverStoragePath`. Tracks store structured `primaryArtistIds`, `featuredArtistIds`, `allArtistIds`, ordered `artistCredits`, `audioUrl` and `audioStoragePath`.

A release starts as a draft. `validateReleaseForPublishing()` checks title, cover, primary artist, at least one track, audio for every track and minimum metadata inside a server transaction before publishing the release and its tracks.

## `invitations/{invitationId}`

Invitations contain a target type and ID, normalized email, role, inviter, status and expiration. The current implementation prepares an invitation without sending email.

## `auditLogs/{auditLogId}`

```ts
{
  actorUserId: string
  action: string
  targetType: "user" | "artist" | "label" | "release" | "track" | "playlist" | "membership"
  targetId: string
  context: { artistId?: string; labelId?: string }
  metadata?: Record<string, unknown>
  createdAt: Timestamp
}
```

Clients cannot create, update or delete audit logs. Only trusted Admin SDK services write them; admin clients receive read-only access.

## Indexes

`firestore.indexes.json` includes composite indexes for active memberships by user, user/entity membership lookups, active label/artist relationships, invitations, published catalog and playlist sorting.
