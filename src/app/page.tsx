import { DiscoverHero } from "@/components/home/discover-hero";
import { HorizontalSection } from "@/components/home/horizontal-section";
import { SectionHeader } from "@/components/home/section-header";
import { ArtistCard } from "@/components/artist/artist-card";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import { ReleaseCard } from "@/components/release/release-card";
import { CategoryCard } from "@/components/search/category-card";
import { TrackList } from "@/components/track/track-list";
import { artists, playlists, releases, tracks } from "@/data/mock/catalog";
import { categories } from "@/data/mock/categories";

export default function HomePage() {
  const featuredRelease = releases[0];
  const popularTracks = [...tracks]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5);

  return (
    <div className="page-container">
      <DiscoverHero release={featuredRelease} />

      <HorizontalSection
        title="Made for your night"
        eyebrow="Curated for you"
        href="/library"
      >
        {playlists.slice(0, 5).map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </HorizontalSection>

      <section className="page-section">
        <SectionHeader title="Popular right now" eyebrow="Quietly trending" />
        <div className="border-border bg-surface/55 rounded-2xl border p-2 sm:p-3">
          <TrackList tracks={popularTracks} showHeader={false} compact />
        </div>
      </section>

      <HorizontalSection title="New releases" eyebrow="Just arrived">
        {releases.slice(0, 5).map((release) => (
          <ReleaseCard key={release.id} release={release} />
        ))}
      </HorizontalSection>

      <HorizontalSection title="Popular creators" eyebrow="Voices to know">
        {artists.slice(0, 5).map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </HorizontalSection>

      <HorizontalSection title="Sleep tonight" eyebrow="Rest easier">
        {[playlists[1], playlists[4], playlists[0], playlists[3]].map(
          (playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ),
        )}
      </HorizontalSection>

      <section className="page-section">
        <SectionHeader
          title="Explore ASMR"
          eyebrow="Find your sound"
          href="/search"
        />
        <div className="category-grid">
          {categories.slice(0, 8).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}
