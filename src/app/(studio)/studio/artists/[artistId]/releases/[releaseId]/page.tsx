import { notFound, redirect } from "next/navigation";
import { FileAudio } from "lucide-react";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { ReleaseActions } from "@/components/studio/release-actions";
import { ReleaseCoverUpload } from "@/components/studio/release-cover-upload";
import { ReleaseMetadataForm } from "@/components/studio/release-metadata-form";
import { TrackUploadForm } from "@/components/studio/track-upload-form";
import { TrackActions } from "@/components/studio/track-actions";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getReleaseById } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForRelease } from "@/lib/firebase/firestore/repositories/tracks";
import { can, getLabelIdForArtistAction } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ReleaseDetailPage({
  params,
}: {
  params: Promise<{ artistId: string; releaseId: string }>;
}) {
  const { artistId, releaseId } = await params;
  const { user } = await requireActiveUser();
  const [release, tracks, context] = await Promise.all([
    getReleaseById(releaseId),
    getTracksForRelease(releaseId),
    getArtistPermissionContext(user.uid, artistId, user.claims.admin),
  ]);
  if (!release) notFound();
  if (!release.allArtistIds.includes(artistId) || !can(context, "artist:view"))
    redirect("/studio");
  const canEdit = can(context, "release:edit");
  const canCreate = can(context, "release:create");
  const canDelete = can(context, "release:delete");
  const canAddTrack = can(context, "track:create");
  const canEditTrack = can(context, "track:edit");
  const canDeleteTrack = can(context, "track:delete");
  const canPublish = can(context, "release:publish");
  const orderedTrackIds = tracks.map((track) => track.id);
  return (
    <div>
      <ManagementPageHeader
        eyebrow={`${release.type} · ${release.status}`}
        title={release.title}
        description="Draft workspace for artwork, ordered tracks and publication readiness."
        actions={
          <ReleaseActions
            artistId={artistId}
            releaseId={releaseId}
            canPublish={canPublish}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            status={release.status}
          />
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Status" value={release.status} />
        <StatCard label="Tracks" value={tracks.length} />
        <StatCard
          label="Duration"
          value={`${Math.floor(release.durationSeconds / 60)} min`}
        />
      </div>
      {canEdit && release.status !== "archived" && (
        <ReleaseMetadataForm
          artistId={artistId}
          releaseId={releaseId}
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
      )}
      <div className="mt-8 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        {canEdit ? (
          <ReleaseCoverUpload
            artistId={artistId}
            releaseId={releaseId}
            labelId={getLabelIdForArtistAction(context, "release:edit")}
          />
        ) : (
          <div className="border-border bg-surface rounded-2xl border p-5 text-sm text-amber-200">
            Artwork is read-only for this membership.
          </div>
        )}
        {canAddTrack && (
          <TrackUploadForm
            artistId={artistId}
            releaseId={releaseId}
            nextTrackNumber={tracks.length + 1}
            labelId={getLabelIdForArtistAction(context, "track:create")}
          />
        )}
      </div>
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Tracks</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Structured primary and featured artists are stored separately.
        </p>
        <div className="mt-4">
          {tracks.length === 0 ? (
            <EmptyState
              icon={FileAudio}
              title="No tracks yet"
              description="Upload the first audio master. The release remains a draft until every track is complete."
            />
          ) : (
            <DataTable
              label="Release tracks"
              columns={["#", "Track", "Artists", "Audio", "Status", "Actions"]}
            >
              {tracks.map((track) => (
                <tr key={track.id}>
                  <DataCell>{track.trackNumber}</DataCell>
                  <DataCell>
                    <p className="font-medium">{track.title}</p>
                    {track.explicit && (
                      <span className="text-subtle text-xs">Explicit</span>
                    )}
                  </DataCell>
                  <DataCell>
                    <span className="text-xs">
                      {track.primaryArtistIds.join(", ")}
                      {track.featuredArtistIds.length > 0
                        ? ` feat. ${track.featuredArtistIds.join(" & ")}`
                        : ""}
                    </span>
                  </DataCell>
                  <DataCell>
                    {track.audioStoragePath ? (
                      <span className="text-emerald-300">Ready</span>
                    ) : (
                      <span className="text-amber-200">Missing</span>
                    )}
                  </DataCell>
                  <DataCell>
                    <StatusBadge status={track.status} />
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
                    />
                  </DataCell>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </section>
    </div>
  );
}
