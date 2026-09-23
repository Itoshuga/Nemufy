import Link from "next/link";
import { Music2 } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";

export default async function ArtistTracksPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const tracks = await getTracksForArtist(artistId);
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Music"
        title="Tracks"
        description="Audio masters, credits and release associations across the artist catalog."
      />
      <div className="mt-8">
        {tracks.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="No tracks yet"
            description="Create a release first, then upload its audio from the release workspace."
          />
        ) : (
          <DataTable
            label="Artist tracks"
            columns={["Track", "Release", "Credits", "Duration", "Status"]}
          >
            {tracks.map((track) => (
              <tr key={track.id}>
                <DataCell>
                  <p className="font-medium">{track.title}</p>
                </DataCell>
                <DataCell>
                  <Link
                    href={`/studio/artists/${artistId}/releases/${track.releaseId}`}
                    className="text-primary text-xs"
                  >
                    {track.releaseId}
                  </Link>
                </DataCell>
                <DataCell>
                  <span className="text-xs">
                    {track.primaryArtistIds.join(", ")}
                    {track.featuredArtistIds.length
                      ? ` feat. ${track.featuredArtistIds.join(" & ")}`
                      : ""}
                  </span>
                </DataCell>
                <DataCell>
                  {Math.floor(track.durationSeconds / 60)}:
                  {String(track.durationSeconds % 60).padStart(2, "0")}
                </DataCell>
                <DataCell>
                  <StatusBadge status={track.status} />
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
