import Link from "next/link";
import { Album } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";

export default async function LabelCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ labelId: string }>;
  searchParams: Promise<{ artist?: string; status?: string; type?: string }>;
}) {
  const { labelId } = await params;
  const filters = await searchParams;
  const artists = await getArtistsForLabel(labelId);
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
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Label catalog"
        title="Releases"
        description="A unified catalog view across every actively linked artist."
      />
      <form className="border-border bg-surface mt-8 grid gap-3 rounded-2xl border p-4 sm:grid-cols-4">
        <select
          name="artist"
          defaultValue={filters.artist ?? ""}
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        >
          <option value="">All artists</option>
          {artists.map(({ artist }) => (
            <option key={artist.id} value={artist.id}>
              {artist.displayName || artist.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select
          name="type"
          defaultValue={filters.type ?? ""}
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        >
          <option value="">All types</option>
          <option value="single">Single</option>
          <option value="ep">EP</option>
          <option value="album">Album</option>
        </select>
        <button className="bg-primary text-primary-foreground rounded-full px-5 text-sm font-semibold">
          Apply filters
        </button>
      </form>
      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={Album}
            title="No releases found"
            description="Adjust the filters or create a draft from an artist context."
          />
        ) : (
          <DataTable
            label="Label releases"
            columns={["Artist", "Release", "Type", "Status", "Date"]}
          >
            {rows.map(({ artist, release }) => (
              <tr key={`${artist.id}:${release.id}`}>
                <DataCell>{artist.displayName || artist.name}</DataCell>
                <DataCell>
                  <Link
                    href={`/studio/artists/${artist.id}/releases/${release.id}`}
                    className="text-primary font-medium"
                  >
                    {release.title}
                  </Link>
                </DataCell>
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
    </div>
  );
}
