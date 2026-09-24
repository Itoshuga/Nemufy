# Nemufy Firestore data model

Firestore is treated as a documented data model, not as an unstructured object store. Collection names are English, properties use `camelCase`, timestamps are native Firestore `Timestamp` values, and durable documents carry `schemaVersion: 1`.

## Root collections

| Collection                         | Source of truth                     | Main access path                            |
| ---------------------------------- | ----------------------------------- | ------------------------------------------- |
| `users/{uid}`                      | Nemufy profile and account state    | Server writes; owner reads                  |
| `usernames/{normalizedUsername}`   | Atomic username reservation         | Server only                                 |
| `artists/{artistId}`               | ASMR artist identity                | Verified reads; admin writes                |
| `tracks/{trackId}`                 | Audio track metadata                | Verified reads of published records         |
| `releases/{releaseId}`             | Single, EP and album metadata       | Verified reads of published records         |
| `playlists/{playlistId}`           | Editorial and future user playlists | Verified reads of public records            |
| `categories/{categoryId}`          | ASMR taxonomy                       | Verified reads; admin writes                |
| `artistMemberships/{membershipId}` | User-to-artist management relation  | Member/admin reads; protected server writes |
| `labelMemberships/{membershipId}`  | User-to-label management relation   | Member/admin reads; protected server writes |
| `labelArtists/{relationId}`        | Label-to-artist management relation | Related members/admin                       |

Firebase Authentication is the source of truth for email, credentials and verification state. `users/{uid}` never stores passwords or password hashes. A user, artist and label are deliberately separate entities; active memberships express which users can manage which entities. Only the global administrator flag is stored as a Custom Claim.

## User-owned subcollections

Large or unbounded sets do not live as arrays on `users/{uid}`:

```text
users/{uid}/likedTracks/{trackId}
users/{uid}/followedArtists/{artistId}
users/{uid}/history/{historyId}
users/{uid}/settings/preferences
```

This keeps the profile document small and makes reads, pagination and retention policies independent.

## Artist relationships

Tracks and releases store artist IDs, not copies of artist profiles. `artists/{artistId}` remains authoritative.

Tracks carry `primaryArtistIds`, `secondaryArtistIds`, `featuredArtistIds` and ordered `artistCredits`. `allArtistIds` is an intentional denormalization used for efficient `array-contains` queries across every participation role. Titles never include hardcoded “feat.” text; the UI reconstructs credits from these relationships.

Releases use the same `primaryArtistIds`, `featuredArtistIds` and `allArtistIds` pattern. Track membership in a release is determined by `tracks/{trackId}.releaseId`, avoiding a growing embedded track array.

Playlists currently store an ordered `trackIds` array because editorial playlists are small in this phase. When collaborative or very large playlists arrive, ordered entries should move to `playlists/{playlistId}/items/{itemId}`.

## IDs and timestamps

- Auth-backed user documents use the Firebase Auth UID.
- Seeded catalog IDs are stable IDs from the typed source catalogue.
- Usernames use the normalized username as the document ID.
- `createdAt`, `updatedAt`, `publishedAt`, `likedAt` and equivalent fields use native timestamps.
- Slugs are human-readable routing keys, not document identity.

## Username reservation

Onboarding runs an Admin SDK transaction that reads both `users/{uid}` and `usernames/{normalizedUsername}` before writing either document. A reservation owned by another UID produces `USERNAME_TAKEN`; concurrent attempts therefore cannot claim the same username.

## Security boundary

Web and mobile SDK operations are checked by `firestore.rules` and `storage.rules`. Admin SDK repositories bypass rules by design, so every server endpoint first verifies the Firebase session cookie and derives the UID from verified claims. Never accept a client-provided UID as identity.
