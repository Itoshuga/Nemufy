import Link from "next/link";
import { Music2 } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listTracks } from "@/lib/firebase/firestore/repositories/tracks";

export default async function AdminTracksPage() {
  const tracks = await listTracks();
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Catalog"
        title="Tracks"
        description="Credits, audio readiness, releases and play aggregates."
      />
      <div className="mt-8">
        {tracks.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="No tracks"
            description="Tracks will appear after creators upload audio to a release draft."
          />
        ) : (
          <DataTable
            label="All tracks"
            columns={[
              "Track",
              "Artists",
              "Release",
              "Duration",
              "Status",
              "Plays",
            ]}
          >
            {tracks.map((track) => (
              <tr key={track.id}>
                <DataCell>
                  <Link
                    href={`/admin/tracks/${track.id}`}
                    className="text-primary font-medium"
                  >
                    {track.title}
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
                <DataCell>{track.releaseId ?? "—"}</DataCell>
                <DataCell>
                  {Math.floor(track.durationSeconds / 60)}:
                  {String(track.durationSeconds % 60).padStart(2, "0")}
                </DataCell>
                <DataCell>
                  <StatusBadge status={track.status} />
                </DataCell>
                <DataCell>{track.playCount.toLocaleString()}</DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
