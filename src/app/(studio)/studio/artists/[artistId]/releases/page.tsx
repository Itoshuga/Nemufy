import Link from "next/link";
import { Plus } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { can } from "@/lib/permissions/can";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistPermissionContext } from "@/lib/permissions/server";
import { Album } from "lucide-react";

export default async function ArtistReleasesPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const { user } = await requireActiveUser();
  const [releases, context] = await Promise.all([
    getReleasesForArtist(artistId),
    getArtistPermissionContext(user.uid, artistId, user.claims.admin),
  ]);
  const canCreate = can(context, "release:create");
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Music"
        title="Releases"
        description="Draft, schedule, publish and archive singles, EPs and albums."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={`/studio/artists/${artistId}/releases/new`}>
                <Plus />
                New release
              </Link>
            </Button>
          ) : undefined
        }
      />
      <div className="mt-8">
        {releases.length === 0 ? (
          <EmptyState
            icon={Album}
            title="You haven't released anything yet"
            description="Create your first single, EP or album. Every new release starts as a private draft."
            action={
              canCreate ? (
                <Button asChild>
                  <Link href={`/studio/artists/${artistId}/releases/new`}>
                    Create release
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DataTable
            label="Artist releases"
            columns={[
              "Release",
              "Type",
              "Status",
              "Release date",
              "Tracks",
              "Actions",
            ]}
          >
            {releases.map((release) => (
              <tr key={release.id}>
                <DataCell>
                  <p className="font-medium">{release.title}</p>
                  <p className="text-subtle mt-1 text-xs">{release.slug}</p>
                </DataCell>
                <DataCell className="uppercase">{release.type}</DataCell>
                <DataCell>
                  <StatusBadge status={release.status} />
                </DataCell>
                <DataCell>
                  {release.releaseDate.toDate().toLocaleDateString()}
                </DataCell>
                <DataCell>—</DataCell>
                <DataCell>
                  <Link
                    className="text-primary text-xs font-semibold"
                    href={`/studio/artists/${artistId}/releases/${release.id}`}
                  >
                    Open
                  </Link>
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
