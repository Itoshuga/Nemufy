import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaylistHeader } from "@/components/release/collection-header";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import { SectionHeader } from "@/components/home/section-header";
import { TrackList } from "@/components/track/track-list";
import { playlists } from "@/data/mock/catalog";
import { getCatalog } from "@/data/catalog";
import { getPlaylistBySlug } from "@/data/mock/selectors";

type PlaylistPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return playlists.map((playlist) => ({ slug: playlist.slug }));
}

export async function generateMetadata({
  params,
}: PlaylistPageProps): Promise<Metadata> {
  const catalog = await getCatalog();
  const playlist = getPlaylistBySlug((await params).slug, catalog.playlists);
  return playlist
    ? { title: playlist.title, description: playlist.description }
    : { title: "Playlist not found" };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const catalog = await getCatalog();
  const playlist = getPlaylistBySlug((await params).slug, catalog.playlists);
  if (!playlist) notFound();

  return (
    <div className="page-container">
      <PlaylistHeader playlist={playlist} />
      <section className="page-section !mt-10">
        <TrackList tracks={playlist.tracks} />
      </section>
      <section className="page-section">
        <SectionHeader title="More from Nemufy" />
        <div className="card-grid">
          {catalog.playlists
            .filter((item) => item.id !== playlist.id)
            .slice(0, 5)
            .map((item) => (
              <PlaylistCard key={item.id} playlist={item} />
            ))}
        </div>
      </section>
    </div>
  );
}
