import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { ManageDrawer } from "@/components/manage/manage-drawer";
import { CreateEntityForm } from "@/components/studio/create-entity-form";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { listLabelsPage } from "@/lib/firebase/firestore/repositories/labels";
import { countReleasesForArtists } from "@/lib/firebase/firestore/repositories/releases";

export default async function ManageAdminLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; cursor?: string }>;
}) {
  const filters = await searchParams;
  const query = filters.q?.trim().toLowerCase() ?? "";
  const page = await listLabelsPage(filters.cursor);
  const labels = page.labels.filter(
    (label) =>
      (!query || label.name.toLowerCase().includes(query)) &&
      (!filters.status || label.status === filters.status),
  );
  const counts = await Promise.all(
    labels.map(async (label) => {
      const artists = await getArtistsForLabel(label.id);
      return {
        artists: artists.length,
        releases: await countReleasesForArtists(
          artists.map(({ artist }) => artist.id),
        ),
      };
    }),
  );
  return (
    <BackofficePage
      eyebrow="Administration"
      title="Labels"
      description="Open any label to manage it with the same shared patterns."
      action={
        <ManageDrawer
          title="New label"
          description="Create a label, then add artists and teammates from its workspace."
          trigger={
            <Button>
              <Plus /> New label
            </Button>
          }
        >
          <CreateEntityForm type="label" />
        </ManageDrawer>
      }
    >
      <form className="mt-8 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="text-subtle absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search labels…"
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
        {labels.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No labels found"
            description="Change the search or create a new label."
          />
        ) : (
          <DataTable
            label="Labels"
            columns={["Label", "Artists", "Releases", "Status", "Verified"]}
          >
            {labels.map((label, index) => (
              <tr key={label.id}>
                <DataCell>
                  <Link
                    href={`/manage/labels/${label.id}`}
                    className="hover:text-primary font-medium"
                  >
                    {label.name}
                  </Link>
                </DataCell>
                <DataCell>{counts[index].artists}</DataCell>
                <DataCell>{counts[index].releases}</DataCell>
                <DataCell>
                  <StatusBadge status={label.status} />
                </DataCell>
                <DataCell>
                  {label.verified ? <StatusBadge status="verified" /> : "—"}
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
                "/manage/admin/labels",
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
