# Roles, subscriptions and permissions

Nemufy uses three independent layers:

1. Firebase Auth identifies the person and carries only fast system claims.
2. Firestore memberships authorize access to a specific artist or label.
3. Subscription fields describe the plan and never grant management access.

## User, Premium, Artist, Label and Admin

- **User** is every active, verified Nemufy account. It can listen and use normal account features.
- **Premium** means `subscriptionPlan = premium` with `active` or `trialing` status. It is not a role.
- **Artist access** exists when the user has an active `artistMembership` for that artist.
- **Label access** exists when the user has an active `labelMembership` for that label.
- **Admin** is a Firebase Custom Claim verified on every protected admin request. A Firestore field alone never grants admin access.

Custom Claims contain only the global `admin` boolean. Artist IDs, label IDs, roles, detailed permissions, subscriptions and teams stay in Firestore. The historical `users.capabilities.artist/label` values may remain temporarily for onboarding compatibility, but they do not grant entity access.

## Artist ownership

Human ownership requires two records with different responsibilities:

- `artistOwnerships/{artistId}` identifies the single primary, verified owner.
- An active `artistMembership` with role `owner` grants the management permissions.

An Owner membership alone can be a historical or team role and is not automatically proof of primary ownership. Likewise, a label can manage an artist through `labelArtists` without owning the artist identity. Approving an artist claim creates both records atomically; releasing ownership revokes the primary membership and makes the profile claimable again without unlinking its label.

Creator applications are not roles and never authorize access while pending. New artist and label access is granted only after an administrator approves the application through the trusted Admin SDK service.

## Permission engine

`src/lib/permissions/can.ts` is the central pure authorization engine. It receives a trusted context resolved by `src/lib/permissions/server.ts`:

```ts
can(
  {
    isAdmin,
    artistMembership,
    labelMembership,
    labelArtistRelation,
  },
  "release:publish",
);
```

For an artist action, access can come from either an active direct artist membership or an active label membership plus an active `labelArtists` relation. Both label-level and relation-level permissions must allow the action. A custom claim such as `artist: true` is never enough by itself.

All sensitive Route Handlers repeat authentication, active-account and entity authorization checks. UI visibility is convenience only.

## Presets

- Artist **Owner**: profile, releases, tracks, publishing, team and analytics.
- Artist **Manager**: profile, releases, tracks, publishing and analytics; no ownership/team transfer.
- Artist **Editor**: profile, releases and tracks; no publishing or team management.
- Artist **Viewer**: read-only workspace and analytics.
- Label **Owner/Admin**: every label permission.
- Label **Manager**: label, artists, releases, tracks, publishing and analytics; no team management.
- Label **Editor**: release and track editing; no publishing, artist linking or team management.
- Label **Viewer**: read-only workspace and analytics.

Presets are centralized in `src/lib/permissions/presets.ts`.

## Permission matrix

| Action                        | User | Artist member | Label member | Admin |
| ----------------------------- | :--: | :-----------: | :----------: | :---: |
| Listen                        |  ✓   |       ✓       |      ✓       |   ✓   |
| Create playlist               |  ✓   |       ✓       |      ✓       |   ✓   |
| Open backoffice               |  —   |       ✓       |      ✓       |   ✓   |
| Edit artist                   |  —   |      ✓*       |      ✓*      |   ✓   |
| Create/edit release           |  —   |      ✓*       |      ✓*      |   ✓   |
| Publish release               |  —   |      ✓*       |      ✓*      |   ✓   |
| Manage artist team            |  —   |      ✓*       |      —       |   ✓   |
| Manage label                  |  —   |       —       |      ✓*      |   ✓   |
| Manage label team             |  —   |       —       |      ✓*      |   ✓   |
| Manage users and capabilities |  —   |       —       |      —       |   ✓   |
| Read platform audit logs      |  —   |       —       |      —       |   ✓   |

`*` depends on active relationships, the role preset and any explicit override.

## Claims and token refresh

Administrator changes update the Firebase Custom Claim through the Admin SDK and the matching Firestore state. Existing ID tokens can retain an old admin claim for up to their normal lifetime. The admin UI explicitly reports that the affected user must force-refresh the Firebase ID token and recreate the server session; signing out and back in does both.

Membership role changes take effect from Firestore without adding entity-specific claims to a token. The backoffice context switcher is navigation only: every server page and mutation resolves the active membership again.

Suspension updates `accountStatus`, revokes Firebase refresh tokens and is checked whenever Nemufy resolves an active server session.

## Bootstrap and local testing

After the target user has signed in at least once:

```bash
pnpm firebase:set-capabilities -- --uid=FIREBASE_UID --admin=true
```

To attach seeded development entities to an account:

```bash
pnpm firebase:set-capabilities -- --uid=FIREBASE_UID --artist=true --label=true
pnpm firebase:seed -- --force --owner-uid=FIREBASE_UID
```

Sign out and back in after any claim change. Never expose these Admin scripts in a browser bundle.

## Existing-project migration

Preview the membership and claim migration without writing:

```bash
pnpm firebase:migrate-backoffice
```

After reviewing counts and taking a Firestore backup, apply it once:

```bash
pnpm firebase:migrate-backoffice -- --apply
```

The script converts differences from materialized permission maps into `permissionOverrides`, removes the old `permissions` field, and removes legacy `artist`/`label` Custom Claims while preserving every other claim. It is safe to rerun because already-normalized memberships and claims are skipped.

Historical artist ownership is migrated separately and conservatively:

```bash
pnpm firebase:migrate-ownerships
pnpm firebase:migrate-ownerships -- --apply
```

Only artists with exactly one active historical Owner membership are claimed automatically. Ambiguous artists are reported and left unclaimed for manual review.
