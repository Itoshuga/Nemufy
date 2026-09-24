import Link from "next/link";
import { Disc3, Plus } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { ManageDrawer } from "@/components/manage/manage-drawer";
import { LabelArtistActions } from "@/components/studio/label-artist-actions";
import { LabelArtistForm } from "@/components/studio/label-artist-form";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { listArtists } from "@/lib/firebase/firestore/repositories/artists";
import { getAllArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { countReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function ManageLabelArtistsPage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const { user } = await requireActiveUser();
  const [artists, context, allArtists] = await Promise.all([
    getAllArtistsForLabel(labelId),
    requireLabelPermission(user.uid, user.claims.admin, labelId, "label:view"),
    listArtists(100),
  ]);
  const canManage = can(context, "label:manage-artists");
  const releaseCounts = await Promise.all(
    artists.map(({ artist }) => countReleasesForArtist(artist.id)),
  );
  return (
    <BackofficePage
      eyebrow="Label"
      title="Artists"
      description="Artists currently connected to this label."
      action={
        canManage ? (
          <ManageDrawer
            title="Add artist"
            description="Connect an existing artist or create a lightweight profile."
            trigger={
              <Button>
                <Plus /> Add artist
              </Button>
            }
          >
            <LabelArtistForm
              labelId={labelId}
              artistOptions={allArtists
                .filter(
                  (candidate) =>
                    !artists.some(({ artist }) => artist.id === candidate.id),
                )
                .map((candidate) => ({
                  id: candidate.id,
                  name: candidate.displayName || candidate.name,
                }))}
            />
          </ManageDrawer>
        ) : undefined
      }
    >
      <div className="mt-8">
        {artists.length === 0 ? (
          <EmptyState
            icon={Disc3}
            title="No artists yet"
            description="Add an existing artist or create a new one for this label."
          />
        ) : (
          <DataTable
            label="Label artists"
            columns={[
              "Artist",
              "Releases",
              "Status",
              "Relationship",
              "Actions",
            ]}
          >
            {artists.map(({ artist, relation }, index) => (
              <tr key={artist.id}>
                <DataCell>
                  <Link
                    href={`/manage/artists/${artist.id}`}
                    className="hover:text-primary font-medium"
                  >
                    {artist.displayName || artist.name}
                  </Link>
                </DataCell>
                <DataCell>{releaseCounts[index]}</DataCell>
                <DataCell>
                  <StatusBadge status={artist.status ?? "active"} />
                </DataCell>
                <DataCell>
                  <StatusBadge status={relation.status} />
                </DataCell>
                <DataCell>
                  {canManage && relation.status !== "ended" ? (
                    <LabelArtistActions
                      labelId={labelId}
                      artistId={artist.id}
                      action="end"
                    />
                  ) : (
                    "—"
                  )}
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </BackofficePage>
  );
}
