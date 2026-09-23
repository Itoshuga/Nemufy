import Link from "next/link";
import { ListMusic } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { listPlaylists } from "@/lib/firebase/firestore/repositories/playlists";

export default async function AdminPlaylistsPage() {
  const playlists = await listPlaylists();
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Moderation"
        title="Playlists"
        description="Inspect official and user playlists without automatic destructive actions."
      />
      <div className="mt-8">
        {playlists.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="No playlists"
            description="Playlists will appear here when users or the editorial team create them."
          />
        ) : (
          <DataTable
            label="Playlists"
            columns={["Playlist", "Owner", "Visibility", "Tracks", "Created"]}
          >
            {playlists.map((playlist) => (
              <tr key={playlist.id}>
                <DataCell>
                  <Link
                    href={`/admin/playlists/${playlist.id}`}
                    className="text-primary font-medium"
                  >
                    {playlist.title}
                  </Link>
                </DataCell>
                <DataCell>
                  {playlist.creator.name}
                  <p className="text-subtle text-xs">{playlist.creator.id}</p>
                </DataCell>
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
    </div>
  );
}
