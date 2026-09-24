import Link from "next/link";
import { ListMusic } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { listPlaylistsPage } from "@/lib/firebase/firestore/repositories/playlists";

export default async function ManageAdminPlaylistsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const page = await listPlaylistsPage(cursor);
  const playlists = page.playlists;
  return (
    <BackofficePage
      eyebrow="Administration"
      title="Playlists"
      description="Ownership and visibility at a glance. Moderation actions remain secondary."
    >
      <div className="mt-8">
        {playlists.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="No playlists"
            description="User and editorial playlists will appear here."
          />
        ) : (
          <DataTable
            label="Playlists"
            columns={["Playlist", "Owner", "Visibility", "Tracks", "Created"]}
          >
            {playlists.map((playlist) => (
              <tr key={playlist.id}>
                <DataCell>
                  <p className="font-medium">{playlist.title}</p>
                </DataCell>
                <DataCell>{playlist.creator.name}</DataCell>
                <DataCell className="capitalize">
                  {playlist.visibility}
                </DataCell>
                <DataCell>{playlist.trackIds.length}</DataCell>
                <DataCell>
                  {playlist.createdAt.toDate().toLocaleDateString()}
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
              href={`/manage/admin/playlists?cursor=${encodeURIComponent(page.nextCursor)}`}
            >
              Next page
            </Link>
          </Button>
        </div>
      ) : null}
    </BackofficePage>
  );
}
