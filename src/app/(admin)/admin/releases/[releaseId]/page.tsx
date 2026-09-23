import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReleaseModerationActions } from "@/components/admin/release-moderation-actions";
import { getReleaseById } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForRelease } from "@/lib/firebase/firestore/repositories/tracks";

export default async function AdminReleaseDetailPage({
  params,
}: {
  params: Promise<{ releaseId: string }>;
}) {
  const { releaseId } = await params;
  const [release, tracks] = await Promise.all([
    getReleaseById(releaseId),
    getTracksForRelease(releaseId),
  ]);
  if (!release) notFound();
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Release details"
        title={release.title}
        description="Administrative catalog view. Publication controls remain protected by the same server permission engine."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/studio/artists/${release.primaryArtistIds[0]}/releases/${release.id}`}
              className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Open management view
            </Link>
            <ReleaseModerationActions
              releaseId={releaseId}
              status={release.status}
            />
          </div>
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Status" value={release.status} />
        <StatCard label="Type" value={release.type.toUpperCase()} />
        <StatCard label="Tracks" value={tracks.length} />
        <StatCard
          label="Duration"
          value={`${Math.floor(release.durationSeconds / 60)} min`}
        />
      </div>
      <div className="mt-8">
        <DataTable
          label="Release tracks"
          columns={["#", "Track", "Artists", "Status"]}
        >
          {tracks.map((track) => (
            <tr key={track.id}>
              <DataCell>{track.trackNumber}</DataCell>
              <DataCell>
                <Link
                  className="text-primary font-medium"
                  href={`/admin/tracks/${track.id}`}
                >
                  {track.title}
                </Link>
              </DataCell>
              <DataCell>{track.allArtistIds.join(", ")}</DataCell>
              <DataCell>
                <StatusBadge status={track.status} />
              </DataCell>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
