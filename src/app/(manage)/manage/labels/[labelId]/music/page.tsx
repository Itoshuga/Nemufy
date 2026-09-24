import Link from "next/link";
import { Album, Plus } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function ManageLabelMusicPage({
  params,
  searchParams,
}: {
  params: Promise<{ labelId: string }>;
  searchParams: Promise<{ artist?: string; status?: string; type?: string }>;
}) {
  const { labelId } = await params;
  const filters = await searchParams;
  const { user } = await requireActiveUser();
  const [artists, context] = await Promise.all([
    getArtistsForLabel(labelId),
    requireLabelPermission(user.uid, user.claims.admin, labelId, "label:view"),
  ]);
  const groups = await Promise.all(
    artists.map(async ({ artist }) => ({
      artist,
      releases: await getReleasesForArtist(artist.id),
    })),
  );
  const rows = groups
    .flatMap(({ artist, releases }) =>
      releases.map((release) => ({ artist, release })),
    )
    .filter(
      ({ artist, release }) =>
        (!filters.artist || artist.id === filters.artist) &&
        (!filters.status || release.status === filters.status) &&
        (!filters.type || release.type === filters.type),
    );
  const canCreate = can(context, "label:manage-artists") && artists.length > 0;
  return (
    <BackofficePage
      eyebrow="Label"
      title="Music"
      description="One catalog view across every artist connected to this label."
      action={
        canCreate ? (
          <Button asChild>
            <Link href={`/manage/labels/${labelId}/music/new`}>
              <Plus /> New release
            </Link>
          </Button>
        ) : undefined
      }
    >
      <form className="mt-8 flex flex-wrap gap-2">
        <select
          name="artist"
          defaultValue={filters.artist ?? ""}
          className="manage-filter"
        >
          <option value="">Artist: All</option>
          {artists.map(({ artist }) => (
            <option key={artist.id} value={artist.id}>
              {artist.displayName || artist.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="manage-filter"
        >
          <option value="">Status: All</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select
          name="type"
          defaultValue={filters.type ?? ""}
          className="manage-filter"
        >
          <option value="">Type: All</option>
          <option value="single">Single</option>
          <option value="ep">EP</option>
          <option value="album">Album</option>
        </select>
        <Button size="sm" variant="secondary">
          Apply
        </Button>
      </form>
      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState
            icon={Album}
            title="No releases found"
            description="Change the filters or create a release for one of the label artists."
          />
        ) : (
          <DataTable
            label="Label music"
            columns={["Release", "Artist", "Type", "Status", "Date"]}
          >
            {rows.map(({ artist, release }) => (
              <tr key={`${artist.id}:${release.id}`}>
                <DataCell>
                  <Link
                    href={`/manage/releases/${release.id}`}
                    className="hover:text-primary font-medium"
                  >
                    {release.title}
                  </Link>
                </DataCell>
                <DataCell>{artist.displayName || artist.name}</DataCell>
                <DataCell className="uppercase">{release.type}</DataCell>
                <DataCell>
                  <StatusBadge status={release.status} />
                </DataCell>
                <DataCell>
                  {release.releaseDate.toDate().toLocaleDateString()}
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </BackofficePage>
  );
}
