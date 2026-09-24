import Link from "next/link";
import { Disc3, Plus, Search } from "lucide-react";
import { ArtistAdminActions } from "@/components/admin/artist-admin-actions";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { ManageDrawer } from "@/components/manage/manage-drawer";
import { CreateEntityForm } from "@/components/studio/create-entity-form";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listArtistsPage } from "@/lib/firebase/firestore/repositories/artists";
import { getActiveLabelRelationsForArtist } from "@/lib/firebase/firestore/repositories/label-artists";
import { getLabelById } from "@/lib/firebase/firestore/repositories/labels";
import { countReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";

export default async function ManageAdminArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; cursor?: string }>;
}) {
  const filters = await searchParams;
  const query = filters.q?.trim().toLowerCase() ?? "";
  const page = await listArtistsPage(filters.cursor);
  const artists = page.artists.filter(
    (artist) =>
      (!query ||
        (artist.displayName || artist.name).toLowerCase().includes(query)) &&
      (!filters.status || artist.status === filters.status),
  );
  const details = await Promise.all(
    artists.map(async (artist) => {
      const [relations, releases] = await Promise.all([
        getActiveLabelRelationsForArtist(artist.id),
        countReleasesForArtist(artist.id),
      ]);
      const label = relations[0]
        ? await getLabelById(relations[0].labelId)
        : null;
      return { label, releases };
    }),
  );
  return (
    <BackofficePage
      eyebrow="Administration"
      title="Artists"
      description="Open any artist to use the same familiar Backoffice workspace."
      action={
        <ManageDrawer
          title="New artist"
          description="Create the identity first; profile and team can be completed later."
          trigger={
            <Button>
              <Plus /> New artist
            </Button>
          }
        >
          <CreateEntityForm type="artist" />
        </ManageDrawer>
      }
    >
      <form className="mt-8 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="text-subtle absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search artists…"
            className="manage-input pl-10"
          />
        </label>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="manage-filter"
        >
          <option value="">Status: All</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
        </select>
        <Button variant="secondary">Filter</Button>
      </form>
      <div className="mt-5">
        {artists.length === 0 ? (
          <EmptyState
            icon={Disc3}
            title="No artists found"
            description="Change the search or create a new artist."
          />
        ) : (
          <DataTable
            label="Artists"
            columns={["Artist", "Label", "Releases", "Status", "Verified", ""]}
          >
            {artists.map((artist, index) => (
              <tr key={artist.id}>
                <DataCell>
                  <Link
                    href={`/manage/artists/${artist.id}`}
                    className="hover:text-primary font-medium"
                  >
                    {artist.displayName || artist.name}
                  </Link>
                </DataCell>
                <DataCell>
                  {details[index].label?.name ?? "Independent"}
                </DataCell>
                <DataCell>{details[index].releases}</DataCell>
                <DataCell>
                  <StatusBadge status={artist.status} />
                </DataCell>
                <DataCell>
                  {artist.verified ? <StatusBadge status="verified" /> : "—"}
                </DataCell>
                <DataCell>
                  <ArtistAdminActions
                    artistId={artist.id}
                    verified={artist.verified}
                    status={artist.status}
                  />
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
      {page.nextCursor ? (
        <div className="mt-5 flex justify-end">
          <Button asChild variant="secondary">
            <Link
              href={nextPageHref(
                "/manage/admin/artists",
                filters,
                page.nextCursor,
              )}
            >
              Next page
            </Link>
          </Button>
        </div>
      ) : null}
    </BackofficePage>
  );
}

function nextPageHref(
  path: string,
  filters: { q?: string; status?: string },
  cursor: string,
) {
  const parameters = new URLSearchParams();
  if (filters.q) parameters.set("q", filters.q);
  if (filters.status) parameters.set("status", filters.status);
  parameters.set("cursor", cursor);
  return `${path}?${parameters}`;
}
