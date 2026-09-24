# Nemufy backoffice

## Context model

`/manage` is the single entry point for Artist, Label and Admin work. The sidebar switcher changes the current entity:

```text
Managing as
├── Artist · Nemu
├── Artist · Airi
├── Label  · Midnight Records
└── Nemufy Administration
```

Artists linked only through a label appear inside that label's Artists view; they are not duplicated under “My Artists”. Selecting a context never changes permissions. Every page and every mutation resolves the current session, account status, membership and relationship again on the server.

Legacy `/studio/*` and `/admin/*` URLs redirect to their canonical `/manage/*` destination.

## Artist workspace

Routes beneath `/manage/artists/[artistId]` intentionally stay short: Overview, Music, Profile and Team.

- **Overview** shows stored catalog totals and clearly marked development metrics.
- **Profile** manages identity, categories, links, avatar and banner.
- **Music** combines Releases and Tracks with tabs and useful filters.
- **New release** asks only for essential public metadata, creates a draft, then opens the release workspace.
- **Release workspace** uses a shallow `/manage/releases/[releaseId]` URL and combines artwork, metadata, uploads, ordering and publishing. Advanced metadata is progressively disclosed. Raw Firestore IDs are not requested from operators.
- **Team** shows memberships and prepares seven-day invitations.

## Label workspace

Routes beneath `/manage/labels/[labelId]` provide Overview, Artists, Music, Team and Profile.

Labels can:

- create an artist without a matching user account, creating an active `labelArtists` relation;
- select an existing artist by name and request a link, creating a pending relationship;
- open active artist contexts according to label and relation permissions;
- filter aggregate releases by artist, status and type;
- prepare team invitations without coupling the member to an artist identity.

## Administration

`/manage/admin` uses the same shell and shared artist/label workspaces. Its navigation is limited to Overview, Users, Artists, Labels, Music, Playlists, Platform and Audit Logs. Artist and label rows open the exact workspace used by their team; there is no second admin-only editor.

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
