import Link from "next/link";
import { Album } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listReleases } from "@/lib/firebase/firestore/repositories/releases";
import { getAllArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";

export default async function AdminReleasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    type?: string;
    artist?: string;
    label?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const filters = await searchParams;
  const labelArtistIds = filters.label
    ? new Set(
        (await getAllArtistsForLabel(filters.label)).map(
          ({ artist }) => artist.id,
        ),
      )
    : null;
  const from = filters.from ? new Date(`${filters.from}T00:00:00Z`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59Z`) : null;
  const releases = (await listReleases()).filter(
    (release) =>
      (!filters.status || release.status === filters.status) &&
      (!filters.type || release.type === filters.type) &&
      (!filters.artist || release.allArtistIds.includes(filters.artist)) &&
      (!labelArtistIds ||
        release.allArtistIds.some((artistId) =>
          labelArtistIds.has(artistId),
        )) &&
      (!from || release.releaseDate.toDate() >= from) &&
      (!to || release.releaseDate.toDate() <= to),
  );
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Catalog"
        title="Releases"
        description="Every draft, scheduled release, publication and archive on Nemufy."
      />
      <form className="border-border bg-surface mt-8 grid gap-3 rounded-2xl border p-4 sm:grid-cols-3 xl:grid-cols-7">
        <input
          name="artist"
          defaultValue={filters.artist}
          placeholder="Artist ID"
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        />
        <input
          name="label"
          defaultValue={filters.label}
          placeholder="Label ID"
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        />
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
        <input
          name="from"
          type="date"
          defaultValue={filters.from}
          aria-label="Release date from"
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        />
        <input
          name="to"
          type="date"
          defaultValue={filters.to}
          aria-label="Release date to"
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        />
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
          Apply
        </button>
      </form>
      <div className="mt-6">
        {releases.length === 0 ? (
          <EmptyState
            icon={Album}
            title="No releases found"
            description="Change the filters or wait for new catalog activity."
          />
        ) : (
          <DataTable
            label="All releases"
            columns={["Release", "Artists", "Type", "Status", "Date", "Open"]}
          >
            {releases.map((release) => (
              <tr key={release.id}>
                <DataCell>
                  <Link
                    href={`/admin/releases/${release.id}`}
                    className="text-primary font-medium"
                  >
                    {release.title}
                  </Link>
                </DataCell>
                <DataCell>
                  <span className="text-xs">
                    {release.allArtistIds.join(", ")}
                  </span>
                </DataCell>
                <DataCell className="uppercase">{release.type}</DataCell>
                <DataCell>
                  <StatusBadge status={release.status} />
                </DataCell>
                <DataCell>
                  {release.releaseDate.toDate().toLocaleDateString()}
                </DataCell>
                <DataCell>
                  <Link
                    href={`/studio/artists/${release.primaryArtistIds[0]}/releases/${release.id}`}
                    className="text-primary text-xs"
                  >
                    Manage
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
