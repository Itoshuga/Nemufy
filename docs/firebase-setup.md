# Firebase setup for Nemufy

This guide documents the complete Firebase setup used by Nemufy. Keep it with the repository and update it whenever a provider, collection or security rule changes.

## 1. Create or select the Firebase project

1. Open the [Firebase console](https://console.firebase.google.com/).
2. Create a project, or select `nemufyapp` for this repository.
3. Confirm the Google Cloud project ID. Nemufy currently uses `nemufyapp`.
4. Choose billing and analytics settings according to the deployment environment.

Project IDs are permanent and globally unique. Do not use a production project for local rule experiments.

## 2. Add the Web App

From **Project settings → General → Your apps**, add a Web App and copy its configuration values into `.env.local`:

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=
```

These Web SDK identifiers are sent to the browser and are not Admin secrets. Security comes from Authentication, Security Rules, App Check when added, and server authorization.

Add every deployed application domain under **Authentication → Settings → Authorized domains**. Password-reset and email-verification links will fail from unknown domains.

## 3. Enable Authentication

Open **Authentication → Get started → Sign-in method**.

### Email and password

Enable **Email/Password**. Nemufy creates the account in the browser, sends a verification email, exchanges the Firebase ID token for an `httpOnly` server session, and prevents application access until `email_verified` is true.

Customize the sender name, action URL and email templates under **Authentication → Templates** before production.

### Google

Enable **Google**, select the project support email and save. Confirm that the OAuth consent screen and authorized domains are correct. Apple, Discord and GitHub are intentionally not enabled in this phase.

## 4. Create Cloud Firestore

1. Open **Firestore Database → Create database**.
2. Choose **Production mode**; repository rules are deployed separately.
3. Choose the region closest to the majority of listeners and to the future server runtime. The location cannot be changed later without migration.
4. Keep the database ID `(default)` unless a documented multi-database requirement appears.

Nemufy uses the root collections documented in `docs/firestore-data-model.md`. Never create a new root collection without documenting its ownership, access pattern and retention needs.

## 5. Enable Cloud Storage

Open **Storage → Get started**, use the same regional strategy as Firestore where possible, and keep the generated bucket name in:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
FIREBASE_ADMIN_STORAGE_BUCKET=
```

`storage.rules` permits verified users to read media. Artist avatars/banners, release covers and track audio require either an active direct artist membership or an active label membership plus label/artist relationship with the matching permission. Release and audio uploads are also tied to a Firestore release owned by the managed artist. Managed-media deletion remains server-only.

## 6. Configure Firebase Admin

From **Project settings → Service accounts → Firebase Admin SDK**, generate a new private key.

The downloaded JSON contains:

- `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
- `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

Place the values only in `.env.local` or the hosting provider’s encrypted secret manager:

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_STORAGE_BUCKET=
FIREBASE_CATALOG_SOURCE=
```

The Admin initializer converts literal `\n` sequences back into real newlines. Never prefix Admin values with `NEXT_PUBLIC_`, never import `admin.ts` from a Client Component, and never commit the service-account JSON. Revoke unused keys from Google Cloud IAM.

## 7. Install and configure locally

```bash
pnpm install
cp .env.example .env.local
```

Fill `.env.local`, then start Next.js with `pnpm dev`.

The Web SDK, Admin SDK, Auth helpers, Firestore repositories and Storage helpers are separated under `src/lib/firebase/`. The `__session` cookie is `httpOnly`, `sameSite=lax`, secure in production and valid for five days.

## 8. Run the Emulator Suite

Java 11 or newer is required by the Firestore emulator.

```bash
pnpm firebase:emulators
```

The configured ports are:

- Emulator UI: `4000`
- Firestore: `8080`
- Authentication: `9099`
- Storage: `9199`

For a fully emulated Next.js session, use a separate local environment file with:

```env
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
```

Never set these variables in production.

## 9. Test Security Rules

```bash
pnpm test:rules
```

The command starts isolated Firestore and Storage emulators, runs the rule tests, then stops them. Tests cover anonymous, unverified, verified, owner and admin access. Admin SDK code bypasses Security Rules, so server endpoint authorization must also remain tested and reviewed.

## 10. Seed the catalogue

Inspect without writing:

```bash
pnpm firebase:seed -- --dry-run
```

Seed an empty project:

```bash
pnpm firebase:seed
```

The script refuses to touch non-empty catalog collections. `--force` performs idempotent merge writes only and should be used after reviewing the existing data:

```bash
pnpm firebase:seed -- --force
```

The seed migrates typed mocks into normalized artist, track, release, playlist and category documents with native timestamps and stable IDs. It also creates `Midnight Records` and active relations to `Nemu` and `Airi`.

To attach the seeded artists and label to a real development account, first sign in once, copy its Firebase Auth UID, then run:

```bash
pnpm firebase:seed -- --force --owner-uid=FIREBASE_UID
```

The seed creates owner memberships only when `--owner-uid` is provided. Artist and label access is derived directly from these memberships; no corresponding Custom Claim is required.

## 11. Bootstrap the first administrator

An admin cannot be granted from the browser without an already trusted admin. After the target account has signed in once, bootstrap only the first administrator from a trusted local machine:

```bash
pnpm firebase:set-capabilities -- --uid=FIREBASE_UID --admin=true
```

The script updates the Firebase `admin` Custom Claim and Firestore together and writes an audit record. The user must sign out and back in. All subsequent grants and revocations can be made from `/manage/admin/users/[uid]` and are performed through protected server APIs.

For an existing project, preview the one-time backoffice migration with `pnpm firebase:migrate-backoffice`. Back up Firestore, review the printed counts, then use `pnpm firebase:migrate-backoffice -- --apply`. The script preserves exceptional permission differences as overrides and removes obsolete artist/label claims.

## 12. Deploy rules and indexes

Authenticate the Firebase CLI using an authorized Google account, select the expected project, then review the active target:

```bash
pnpm exec firebase use
pnpm firebase:deploy:rules
```

This deploys `firestore.rules`, `firestore.indexes.json` and `storage.rules`. Review the console after deployment and monitor rejected requests before loosening any rule.

The identity used by the CLI must be allowed to inspect enabled Google Cloud services (notably `serviceusage.services.get`) and to update Firestore and Storage rules. A Firebase Admin service account can read or write application data without automatically having these deployment permissions. If the CLI returns a Service Usage `403`, deploy after `firebase login` with a project Owner/Firebase administrator account, or grant only the required deployment roles through Google Cloud IAM.

## 13. Required manual sequence

For a new environment, complete these steps in order:

1. Install Java 11+ and confirm `java -version` works; it is required for emulator rule tests.
2. Enable Email/Password and Google providers, then configure authorized domains.
3. Create the default Firestore database and Storage bucket.
4. Put Web SDK values and Admin credentials in `.env.local` or encrypted hosting secrets.
5. Run `pnpm test:permissions`, `pnpm test:rules`, `pnpm lint`, `pnpm typecheck` and `pnpm build`.
6. Run `pnpm firebase:deploy:rules` against the intended Firebase project.
7. Sign in once with the bootstrap account, grant its admin capability with the trusted CLI script, then sign out/in.
8. Optionally seed development data and owner memberships with `--owner-uid`.
9. Manually exercise User, Artist Owner, Artist Editor, Label Manager, Admin and Suspended User scenarios before production.

Do not run the seed or deploy command against production until the selected Firebase CLI project has been verified.

## 14. Production checklist

- Set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS origin.
- Add the production domain to Firebase Authentication authorized domains.
- Store Admin variables in encrypted runtime secrets.
- Deploy and test Firestore and Storage rules.
- Configure email templates and OAuth consent branding.
- Enable budget alerts, audit logs and App Check before public launch.
- Keep separate Firebase projects for development, staging and production.
- Rotate any service-account key that has been exposed outside the secret manager.

References: [Firebase Web setup](https://firebase.google.com/docs/web/setup), [session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies), [Authentication](https://firebase.google.com/docs/auth), [Security Rules testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator).
