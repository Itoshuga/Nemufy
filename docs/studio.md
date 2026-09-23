# Nemufy Studio

## Context model

`/studio` lists the artist and label entities the current user can manage. The header switcher changes the current entity:

```text
Managing as
├── Artist · Nemu
├── Artist · Airi
└── Label  · Midnight Records
```

Selecting a context never changes permissions. Every page and every mutation resolves the current session, account status, membership and relationship again on the server.

## Artist Studio

Routes include overview, profile, releases, tracks, team, analytics and settings beneath `/studio/artists/[artistId]`.

- **Overview** shows stored catalog totals and clearly marked development metrics.
- **Profile** manages identity, categories, links, avatar and banner.
- **Releases** separates draft, scheduled, published and archived states.
- **New release** uses seven visible workflow stages and always creates a draft.
- **Release workspace** edits and duplicates metadata, uploads previewed cover artwork, and manages ordered audio tracks with structured featuring credits and optional track covers. Draft removal is a recoverable archive operation.
- **Team** shows memberships and prepares seven-day invitations.
- **Analytics** does not present placeholder events as real production data.

## Label Studio

Routes beneath `/studio/labels/[labelId]` provide overview, artists, aggregate catalog, team, analytics and label profile.

Labels can:

- create an artist without a matching user account, creating an active `labelArtists` relation;
- request a link to an existing artist, creating a pending relationship;
- open active artist contexts according to label and relation permissions;
- filter aggregate releases by artist, status and type;
- prepare team invitations without coupling the member to an artist identity.

## Upload workflow

Client upload helpers live in `src/lib/firebase/storage/uploads.ts`, not UI components. They validate MIME type, maximum size and image dimensions, then expose progress and cancellation through Firebase resumable uploads.

```text
select file
  → validate
  → upload to scoped Storage path
  → receive download URL + keep storagePath
  → send metadata to a protected Route Handler
  → re-check membership and persist Firestore document
```

Paths are:

```text
artists/{artistId}/avatar/{file}
artists/{artistId}/banner/{file}
releases/{releaseId}/cover/{file}
tracks/{trackId}/audio/{file}
tracks/{trackId}/cover/{file}
```

Storage Rules verify direct artist memberships or a label membership plus active label/artist relationship. Route Handlers then verify that the metadata belongs to the selected artist/release before persisting it.

## Publishing

Publication is an explicit server operation. It requires `release:publish` and validates minimum release and track data inside a transaction. A future release date produces `scheduled`; a current/past date produces `published`. Editors can create, edit and reorder drafts but cannot publish.

Transcoding, HLS, DRM, royalties, payments and advanced analytics remain intentionally out of scope.
