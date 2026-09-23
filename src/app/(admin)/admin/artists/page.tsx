import Link from "next/link";
import { Disc3 } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listArtists } from "@/lib/firebase/firestore/repositories/artists";
import { getActiveLabelRelationsForArtist } from "@/lib/firebase/firestore/repositories/label-artists";
import { getArtistTeam } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";

export default async function AdminArtistsPage() {
  const artists = await listArtists();
  const details = await Promise.all(
    artists.map(async (artist) => {
      const [labels, team, releases, tracks] = await Promise.all([
        getActiveLabelRelationsForArtist(artist.id),
        getArtistTeam(artist.id),
        getReleasesForArtist(artist.id),
        getTracksForArtist(artist.id),
      ]);
      return { labels, team, releases, tracks };
    }),
  );
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Catalog entities"
        title="Artists"
        description="Verification, lifecycle, managers and catalog ownership across the platform."
      />
      <div className="mt-8">
        {artists.length === 0 ? (
          <EmptyState
            icon={Disc3}
            title="No artists"
            description="Artist identities will appear here once created."
          />
        ) : (
          <DataTable
            label="Artists"
            columns={[
              "Artist",
              "Verified",
              "Status",
              "Labels",
              "Managers",
              "Releases",
              "Tracks",
            ]}
          >
            {artists.map((artist, index) => (
              <tr key={artist.id}>
                <DataCell>
                  <Link
                    href={`/admin/artists/${artist.id}`}
                    className="text-primary font-medium"
                  >
                    {artist.displayName || artist.name}
                  </Link>
                  <p className="text-subtle text-xs">{artist.id}</p>
                </DataCell>
                <DataCell>
                  {artist.verified ? <StatusBadge status="verified" /> : "No"}
                </DataCell>
                <DataCell>
                  <StatusBadge status={artist.status ?? "active"} />
                </DataCell>
                <DataCell>{details[index].labels.length}</DataCell>
                <DataCell>{details[index].team.length}</DataCell>
                <DataCell>{details[index].releases.length}</DataCell>
                <DataCell>{details[index].tracks.length}</DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
