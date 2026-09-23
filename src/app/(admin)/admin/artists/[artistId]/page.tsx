import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistModerationActions } from "@/components/admin/artist-moderation-actions";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getArtistById } from "@/lib/firebase/firestore/repositories/artists";
import { getActiveLabelRelationsForArtist } from "@/lib/firebase/firestore/repositories/label-artists";
import { getArtistTeam } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";

export default async function AdminArtistDetailPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const [artist, team, labelRelations, releases, tracks] = await Promise.all([
    getArtistById(artistId),
    getArtistTeam(artistId),
    getActiveLabelRelationsForArtist(artistId),
    getReleasesForArtist(artistId),
    getTracksForArtist(artistId),
  ]);
  if (!artist) notFound();
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Artist details"
        title={artist.displayName || artist.name}
        description="Platform-wide moderation view of profile, memberships, label relationships and catalog."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/studio/artists/${artistId}/profile`}
              className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Manage artist
            </Link>
            <ArtistModerationActions
              artistId={artistId}
              verified={artist.verified}
              status={artist.status ?? "active"}
            />
          </div>
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={team.length} />
        <StatCard label="Labels" value={labelRelations.length} />
        <StatCard label="Releases" value={releases.length} />
        <StatCard label="Tracks" value={tracks.length} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold">Memberships</h2>
          <DataTable
            label="Artist memberships"
            columns={["User", "Role", "Status"]}
          >
            {team.map(({ membership, user }) => (
              <tr key={membership.id}>
                <DataCell>
                  {user?.displayName ?? user?.username ?? membership.userId}
                </DataCell>
                <DataCell className="capitalize">{membership.role}</DataCell>
                <DataCell>
                  <StatusBadge status={membership.status} />
                </DataCell>
              </tr>
            ))}
          </DataTable>
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Label relationships</h2>
          <DataTable
            label="Label relationships"
            columns={["Label ID", "Status", "Joined"]}
          >
            {labelRelations.map((relation) => (
              <tr key={relation.id}>
                <DataCell>{relation.labelId}</DataCell>
                <DataCell>
                  <StatusBadge status={relation.status} />
                </DataCell>
                <DataCell>
                  {relation.joinedAt.toDate().toLocaleDateString()}
                </DataCell>
              </tr>
            ))}
          </DataTable>
        </section>
      </div>
      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Releases</h2>
        <DataTable
          label="Artist releases"
          columns={["Release", "Type", "Status", "Tracks"]}
        >
          {releases.map((release) => (
            <tr key={release.id}>
              <DataCell>{release.title}</DataCell>
              <DataCell className="uppercase">{release.type}</DataCell>
              <DataCell>
                <StatusBadge status={release.status} />
              </DataCell>
              <DataCell>
                {
                  tracks.filter((track) => track.releaseId === release.id)
                    .length
                }
              </DataCell>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}
