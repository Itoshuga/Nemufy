import Link from "next/link";
import { Building2 } from "lucide-react";
import { LabelArtistForm } from "@/components/studio/label-artist-form";
import { LabelArtistActions } from "@/components/studio/label-artist-actions";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getAllArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function LabelArtistsPage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const { user } = await requireActiveUser();
  const [artists, context] = await Promise.all([
    getAllArtistsForLabel(labelId),
    requireLabelPermission(user.uid, user.claims.admin, labelId, "label:view"),
  ]);
  const canManage = can(context, "label:manage-artists");
  const counts = await Promise.all(
    artists.map(async ({ artist }) => {
      const [releases, tracks] = await Promise.all([
        getReleasesForArtist(artist.id),
        getTracksForArtist(artist.id),
      ]);
      return { releases: releases.length, tracks: tracks.length };
    }),
  );
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Label"
        title="Artists"
        description="Existing artists are invited through a pending relationship; newly created artists can exist without a user account."
      />
      {canManage && (
        <div className="mt-8">
          <LabelArtistForm labelId={labelId} />
        </div>
      )}
      <div className="mt-6">
        {artists.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No artists yet"
            description="Add your first artist or request a relationship with an existing Nemufy artist."
          />
        ) : (
          <DataTable
            label="Label artists"
            columns={[
              "Artist",
              "Relationship",
              "Artist status",
              "Releases",
              "Tracks",
              "Manage",
            ]}
          >
            {artists.map(({ artist, relation }, index) => (
              <tr key={artist.id}>
                <DataCell>
                  <p className="font-medium">
                    {artist.displayName || artist.name}
                  </p>
                  <p className="text-subtle text-xs">{artist.id}</p>
                </DataCell>
                <DataCell>
                  <StatusBadge status={relation.status} />
                </DataCell>
                <DataCell>
                  <StatusBadge status={artist.status ?? "active"} />
                </DataCell>
                <DataCell>{counts[index].releases}</DataCell>
                <DataCell>{counts[index].tracks}</DataCell>
                <DataCell>
                  <div className="flex items-center gap-2">
                    {relation.status === "active" ? (
                      <Link
                        className="text-primary text-xs"
                        href={`/studio/artists/${artist.id}/overview`}
                      >
                        Manage
                      </Link>
                    ) : (
                      <span className="text-subtle text-xs">
                        Awaiting approval
                      </span>
                    )}
                    {canManage && relation.status !== "ended" && (
                      <LabelArtistActions
                        labelId={labelId}
                        artistId={artist.id}
                        action="end"
                      />
                    )}
                  </div>
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
