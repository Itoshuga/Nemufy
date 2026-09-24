# Creator applications and artist ownership

Nemufy uses one review inbox for creator access. A submitted application never grants access by itself. Access appears only after a trusted server transaction has approved the request and created the corresponding membership.

## Application types

- `artist_claim`: claim an existing, unclaimed artist profile.
- `artist_creation`: request a new artist profile. No artist is created before approval.
- `label_creation`: request a new label. No label is created before approval.

Statuses are `pending`, `under_review`, `needs_information`, `approved`, `rejected` and `cancelled`.

User routes:

- `/creator`
- `/creator/artist/claim`
- `/creator/artist/apply`
- `/creator/label/apply`
- `/creator/applications`
- `/creator/applications/[applicationId]`

Admin routes:

- `/manage/admin/requests`
- `/manage/admin/requests/[applicationId]`

## Artist claims

The authoritative eligibility check runs on the server. The artist must exist, its `claimStatus` must not be `claimed`, and `artistOwnerships/{artistId}` must not exist. One applicant cannot keep multiple active claims for the same artist.

Approving a claim runs in a Firestore transaction:

1. Re-read the application, artist, ownership, applicant and membership.
2. Verify that the application is reviewable and the artist is still unclaimed.
3. Create or promote the applicant's `artistMembership` to active `owner`.
4. Create `artistOwnerships/{artistId}`.
5. Set `artist.claimStatus = claimed`.
6. Approve the application and write audit logs.
7. Reject other active claims for the same artist with `artist_already_claimed`.

The deterministic ownership document ID is the artist ID, so concurrent approvals cannot create two active ownership records. Firestore transaction retries make the first successful ownership creation authoritative.

Additional team members never use the public claim flow after ownership exists. They are invited from Artist Studio → Team.

## Artist creation

Submitting an artist creation application stores only the requested identity. Approval creates the artist, marks it `claimed`, creates the owner membership and ownership document, enables the user's artist capability summary, and records audit events. Admins can convert a possible duplicate into an existing-artist claim instead of creating a second profile.

Artists created directly by an administrator or from a label workspace start as `unclaimed`. A label relationship remains independent from human ownership.

## Label creation

Submitting a label application grants nothing. Approval creates the label and an active owner `labelMembership` in one transaction, then exposes the label through the existing context switcher. An artist claim never grants label access.

## More information, rejection and cancellation

Admin/applicant exchanges live under `applications/{applicationId}/messages/{messageId}`. Requesting information changes the application to `needs_information`; the applicant's response returns it to `under_review`. Rejection requires a reason and a message visible to the applicant. Applicants can cancel only an active application.

## Releasing ownership

Only an admin can release ownership. The server transaction revokes the primary owner membership, deletes `artistOwnerships/{artistId}`, sets `claimStatus = unclaimed`, updates the user's artist capability when appropriate, and writes `artist.ownership.release`. It never changes a `labelArtists` relationship.

## Security

All submissions, replies and decisions use authenticated Route Handlers and Zod validation. Admin decisions additionally require the Firebase `admin` Custom Claim. Firestore client rules allow an applicant to read only their own application and messages; all application mutations are intentionally server-only so duplicate checks, rate controls and state transitions cannot be bypassed. `artistOwnerships` is admin-readable and has no client writes.

## Migration

Preview the ownership migration:

```bash
pnpm firebase:migrate-ownerships
```

After a backup and review, apply it explicitly:

```bash
pnpm firebase:migrate-ownerships -- --apply
```

The script creates ownership only when an artist has exactly one active historical Owner membership. Existing ownerships are preserved, artists with multiple active owners are reported as ambiguous, and all remaining artists are marked `unclaimed`. It is dry-run by default and safe to rerun after a successful application.

Direct ownership transfer is intentionally deferred. The current recovery flow is release ownership, then approve a new claim.
