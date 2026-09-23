# Roles, subscriptions and permissions

Nemufy uses three independent layers:

1. Firebase Auth identifies the person and carries only fast system claims.
2. Firestore memberships authorize access to a specific artist or label.
3. Subscription fields describe the plan and never grant management access.

## User, Premium, Artist, Label and Admin

- **User** is every active, verified Nemufy account. It can listen and use normal account features.
- **Premium** means `subscriptionPlan = premium` with `active` or `trialing` status. It is not a role.
- **Artist capability** allows entry into artist onboarding/creation, but an active `artistMembership` is still required for a particular artist.
- **Label capability** allows label onboarding/creation, but an active `labelMembership` is still required for a particular label.
- **Admin** is a Firebase Custom Claim verified on every protected admin request. A Firestore field alone never grants admin access.

Custom Claims contain only `admin`, `artist` and `label` booleans. Artist IDs, label IDs, detailed permissions, subscriptions and teams stay in Firestore.

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
- Label **Owner/Admin**: every label permission.
- Label **Manager**: label, artists, releases, tracks, publishing and analytics; no team management.
- Label **Editor**: release and track editing; no publishing, artist linking or team management.

Presets are centralized in `src/lib/permissions/presets.ts`.

## Permission matrix

| Action                        | User | Artist member | Label member | Admin |
| ----------------------------- | :--: | :-----------: | :----------: | :---: |
| Listen                        |  ✓   |       ✓       |      ✓       |   ✓   |
| Create playlist               |  ✓   |       ✓       |      ✓       |   ✓   |
| Open Studio                   |  —   |       ✓       |      ✓       |   ✓   |
| Edit artist                   |  —   |      ✓*       |      ✓*      |   ✓   |
| Create/edit release           |  —   |      ✓*       |      ✓*      |   ✓   |
| Publish release               |  —   |      ✓*       |      ✓*      |   ✓   |
| Manage artist team            |  —   |      ✓*       |      —       |   ✓   |
| Manage label                  |  —   |       —       |      ✓*      |   ✓   |
| Manage label team             |  —   |       —       |      ✓*      |   ✓   |
| Manage users and capabilities |  —   |       —       |      —       |   ✓   |
| Read platform audit logs      |  —   |       —       |      —       |   ✓   |

`*` depends on active relationships and the stored permissions.

## Claims and token refresh

Capability changes update Firebase Custom Claims through the Admin SDK and the matching Firestore state. Existing ID tokens can retain old claims for up to their normal lifetime. The admin UI explicitly reports that the affected user must force-refresh the Firebase ID token and recreate the server session; signing out and back in does both.

Suspension updates `accountStatus`, revokes Firebase refresh tokens and is checked whenever Nemufy resolves an active server session.

## Bootstrap and local testing

After the target user has signed in at least once:

```bash
pnpm firebase:set-capabilities -- --uid=FIREBASE_UID --admin=true
```

To create a multi-role development account:

```bash
pnpm firebase:set-capabilities -- --uid=FIREBASE_UID --artist=true --label=true
pnpm firebase:seed -- --force --owner-uid=FIREBASE_UID
```

Sign out and back in after any claim change. Never expose these Admin scripts in a browser bundle.
