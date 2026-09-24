import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileAudio, Plus } from "lucide-react";
import {
  AccessDenied,
  BackofficePage,
} from "@/components/manage/backoffice-page";
import { ManageDrawer } from "@/components/manage/manage-drawer";
import { ReleaseActions } from "@/components/studio/release-actions";
import { ReleaseCoverUpload } from "@/components/studio/release-cover-upload";
import { ReleaseMetadataForm } from "@/components/studio/release-metadata-form";
import { TrackActions } from "@/components/studio/track-actions";
import { TrackUploadForm } from "@/components/studio/track-upload-form";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import {
  getArtistById,
  listArtists,
} from "@/lib/firebase/firestore/repositories/artists";
import { listCategories } from "@/lib/firebase/firestore/repositories/categories";
import { getReleaseById } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForRelease } from "@/lib/firebase/firestore/repositories/tracks";
import { can, getLabelIdForArtistAction } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ManageReleasePage({
  params,
}: {
  params: Promise<{ releaseId: string }>;
}) {
  const { releaseId } = await params;
  const { user } = await requireActiveUser();
  const release = await getReleaseById(releaseId);
  if (!release) notFound();
  const artistId = release.primaryArtistIds[0];
  if (!artistId) notFound();
  const [artist, tracks, context, artistOptions, categories] =
    await Promise.all([
      getArtistById(artistId),
      getTracksForRelease(releaseId),
      getArtistPermissionContext(user.uid, artistId, user.claims.admin),
      listArtists(100),
      listCategories(),
    ]);
  if (!artist || !can(context, "artist:view"))
    return <AccessDenied entity="release" />;

  const canEdit = can(context, "release:edit");
  const canCreate = can(context, "release:create");
  const canDelete = can(context, "release:delete");
  const canAddTrack = can(context, "track:create");
  const canEditTrack = can(context, "track:edit");
  const canDeleteTrack = can(context, "track:delete");
  const canPublish = can(context, "release:publish");
  const labelId = getLabelIdForArtistAction(context, "release:edit");
  const options = artistOptions.map((option) => ({
    id: option.id,
    name: option.displayName || option.name,
  }));
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));
  const orderedTrackIds = tracks.map((track) => track.id);

  return (
    <BackofficePage
      eyebrow={`${release.type} · ${artist.displayName || artist.name}`}
      title={release.title}
      description="Artwork, details and tracks in one focused workspace."
      action={
        <ReleaseActions
          artistId={artistId}
          releaseId={releaseId}
          canPublish={canPublish}
          canEdit={canEdit}
          canCreate={canCreate}
          canDelete={canDelete}
          isAdmin={user.claims.admin}
          status={release.status}
        />
      }
    >
      <Link
        href={`/manage/artists/${artistId}/music`}
        className="text-muted-foreground hover:text-foreground mt-5 inline-flex items-center gap-2 text-xs font-semibold"
      >
        <ArrowLeft className="size-3.5" /> Music
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={release.status} />
        <span className="text-subtle text-xs">{tracks.length} tracks</span>
        <span className="text-subtle text-xs">
          {Math.floor(release.durationSeconds / 60)} min
        </span>
        {release.coverStoragePath ? (
          <span className="text-xs text-emerald-300">Cover ready</span>
        ) : (
          <span className="text-xs text-amber-200">Cover missing</span>
        )}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(260px,.65fr)_minmax(0,1.35fr)]">
        {canEdit ? (
          <ReleaseCoverUpload
            artistId={artistId}
            releaseId={releaseId}
            labelId={labelId}
          />
        ) : (
          <div className="border-border bg-surface rounded-2xl border p-5 text-sm text-amber-200">
            Artwork is read-only for this role.
          </div>
        )}
        <ReleaseMetadataForm
          artistId={artistId}
          releaseId={releaseId}
          artistName={artist.displayName || artist.name}
          artistOptions={options}
          readOnly={!canEdit || release.status === "archived"}
          initial={{
            title: release.title,
            type: release.type,
            releaseDate: release.releaseDate
              .toDate()
              .toISOString()
              .slice(0, 10),
            description: release.description ?? "",
            copyright: release.copyright ?? "",
            explicit: release.explicit,
            primaryArtistIds: release.primaryArtistIds,
            featuredArtistIds: release.featuredArtistIds,
          }}
        />
      </div>

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tracks</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Add, order and review the audio inside this release.
            </p>
          </div>
          {canAddTrack ? (
            <ManageDrawer
              title="Add track"
              description="Upload audio and enter only the listener-facing information."
              trigger={
                <Button>
                  <Plus /> Add track
                </Button>
              }
            >
              <TrackUploadForm
                artistId={artistId}
                releaseId={releaseId}
                nextTrackNumber={tracks.length + 1}
                labelId={getLabelIdForArtistAction(context, "track:create")}
                primaryArtistName={artist.displayName || artist.name}
                artistOptions={options}
                categoryOptions={categoryOptions}
              />
            </ManageDrawer>
          ) : null}
        </div>
        <div className="mt-4">
          {tracks.length === 0 ? (
            <EmptyState
              icon={FileAudio}
              title="No tracks yet"
              description="Add the first audio file to continue preparing this release."
            />
          ) : (
            <DataTable
              label="Release tracks"
              columns={[
                "#",
                "Track",
                "Artists",
                "Duration",
                "Audio",
                "Actions",
              ]}
            >
              {tracks.map((track) => (
                <tr key={track.id}>
                  <DataCell>
                    {String(track.trackNumber ?? 0).padStart(2, "0")}
                  </DataCell>
                  <DataCell>
                    <p className="font-medium">{track.title}</p>
                    {track.explicit ? (
                      <span className="text-subtle text-xs">Explicit</span>
                    ) : null}
                  </DataCell>
                  <DataCell>
                    <span className="text-xs">
                      {formatArtists(
                        track.primaryArtistIds,
                        track.featuredArtistIds,
                        options,
                      )}
                    </span>
                  </DataCell>
                  <DataCell>
                    {Math.floor(track.durationSeconds / 60)}:
                    {String(track.durationSeconds % 60).padStart(2, "0")}
                  </DataCell>
                  <DataCell>
                    {track.audioStoragePath ? (
                      <span className="text-xs text-emerald-300">Uploaded</span>
                    ) : (
                      <span className="text-xs text-amber-200">Missing</span>
                    )}
                  </DataCell>
                  <DataCell>
                    <TrackActions
                      artistId={artistId}
                      releaseId={releaseId}
                      track={{
                        id: track.id,
                        title: track.title,
                        primaryArtistIds: track.primaryArtistIds,
                        featuredArtistIds: track.featuredArtistIds,
                        categoryIds: track.categoryIds,
                        tags: track.tags,
                        explicit: track.explicit,
                        status: track.status,
                      }}
                      orderedTrackIds={orderedTrackIds}
                      canEdit={canEditTrack}
                      canDelete={canDeleteTrack}
                      labelId={getLabelIdForArtistAction(context, "track:edit")}
                      primaryArtistName={artist.displayName || artist.name}
                      artistOptions={options}
                      categoryOptions={categoryOptions}
                    />
                  </DataCell>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </section>
    </BackofficePage>
  );
}

function formatArtists(
  primaryIds: string[],
  featuredIds: string[],
  options: Array<{ id: string; name: string }>,
) {
  const name = (id: string) =>
    options.find((option) => option.id === id)?.name ?? "Artist";
  const primary = primaryIds.map(name).join(", ");
  return featuredIds.length > 0
    ? `${primary} feat. ${featuredIds.map(name).join(" & ")}`
    : primary;
}
