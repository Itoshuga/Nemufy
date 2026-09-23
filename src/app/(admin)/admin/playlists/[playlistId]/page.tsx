import { notFound } from "next/navigation";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { getPlaylistById } from "@/lib/firebase/firestore/repositories/playlists";

export default async function AdminPlaylistDetailPage({
  params,
}: {
  params: Promise<{ playlistId: string }>;
}) {
  const { playlistId } = await params;
  const playlist = await getPlaylistById(playlistId);
  if (!playlist) notFound();
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Playlist moderation"
        title={playlist.title}
        description={playlist.description}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Visibility" value={playlist.visibility} />
        <StatCard label="Tracks" value={playlist.trackIds.length} />
        <StatCard label="Owner" value={playlist.creator.name} />
      </div>
      <section className="border-border bg-surface mt-8 rounded-2xl border p-6">
        <h2 className="font-semibold">Track IDs</h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {playlist.trackIds.map((trackId, index) => (
            <li
              key={trackId}
              className="bg-background/50 rounded-xl p-3 text-sm"
            >
              <span className="text-subtle mr-3">{index + 1}</span>
              {trackId}
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground mt-5 text-xs">
          No content is removed automatically from this inspection view.
        </p>
      </section>
    </div>
  );
}
