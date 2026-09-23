"use client";

import { Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ArtistCard } from "@/components/artist/artist-card";
import { CoverImage } from "@/components/media/cover-image";
import { PlayButton } from "@/components/player/play-button";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import { ReleaseCard } from "@/components/release/release-card";
import { CategoryCard } from "@/components/search/category-card";
import { SectionHeader } from "@/components/home/section-header";
import { TrackList } from "@/components/track/track-list";
import { Button } from "@/components/ui/button";
import { artists, playlists, releases, tracks } from "@/data/mock/catalog";
import { categories } from "@/data/mock/categories";

const normalize = (value: string) => value.toLocaleLowerCase().trim();

export function SearchExperience({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const normalizedQuery = normalize(query);

  const results = useMemo(() => {
    if (!normalizedQuery) return null;

    const match = (...values: string[]) =>
      values.some((value) => normalize(value).includes(normalizedQuery));

    const matchingArtists = artists.filter((artist) =>
      match(artist.name, artist.displayName, ...artist.genres),
    );
    const matchingTracks = tracks.filter((item) =>
      match(
        item.title,
        ...item.tags,
        ...item.categories,
        ...item.primaryArtists.map((artist) => artist.displayName),
        ...item.featuredArtists.map((artist) => artist.displayName),
      ),
    );
    const matchingReleases = releases.filter((release) =>
      match(
        release.title,
        ...release.tags,
        ...release.artists.map((artist) => artist.displayName),
      ),
    );
    const matchingPlaylists = playlists.filter((playlist) =>
      match(
        playlist.title,
        playlist.description,
        ...playlist.tracks.flatMap((track) => track.categories),
      ),
    );

    return {
      artists: matchingArtists,
      tracks: matchingTracks,
      releases: matchingReleases,
      playlists: matchingPlaylists,
      count:
        matchingArtists.length +
        matchingTracks.length +
        matchingReleases.length +
        matchingPlaylists.length,
    };
  }, [normalizedQuery]);

  return (
    <div>
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="relative max-w-2xl"
      >
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Artists, tracks, releases or quiet moods"
          aria-label="Search Nemufy"
          autoFocus
          className="border-border bg-surface text-foreground focus:border-primary/50 focus:ring-primary/10 h-14 w-full rounded-2xl border pr-12 pl-13 text-sm transition outline-none focus:ring-4"
        />
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-3 -translate-y-1/2"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X />
          </Button>
        ) : null}
      </form>

      {!results ? (
        <section className="page-section">
          <SectionHeader title="Browse all" eyebrow="Explore by feeling" />
          <div className="category-grid">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      ) : results.count === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center text-center">
          <span className="bg-surface text-primary mb-5 grid size-12 place-items-center rounded-2xl">
            <Sparkles className="size-5" />
          </span>
          <h2 className="text-foreground text-lg font-semibold">
            No quiet matches yet
          </h2>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
            Try a creator like Nemu, a mood like Sleep, or a sound like Tapping.
          </p>
        </div>
      ) : (
        <SearchResults query={query} results={results} />
      )}
    </div>
  );
}

type SearchResultsProps = {
  query: string;
  results: {
    artists: typeof artists;
    tracks: typeof tracks;
    releases: typeof releases;
    playlists: typeof playlists;
    count: number;
  };
};

function SearchResults({ query, results }: SearchResultsProps) {
  const topArtist = results.artists[0];
  const topTrack = results.tracks[0];
  return (
    <div className="mt-10 space-y-12">
      <p className="text-muted-foreground text-sm">
        {results.count} result{results.count === 1 ? "" : "s"} for{" "}
        <span className="text-foreground font-semibold">“{query.trim()}”</span>
      </p>

      {topArtist || topTrack ? (
        <section>
          <SectionHeader title="Top result" />
          <div className="border-border bg-surface relative flex max-w-xl items-center gap-5 overflow-hidden rounded-3xl border p-5">
            <CoverImage
              src={topArtist?.avatar ?? topTrack?.cover}
              alt=""
              sizes="112px"
              className={`size-28 shrink-0 ${topArtist ? "rounded-full" : "rounded-2xl"}`}
            />
            <div className="min-w-0">
              <p className="text-primary text-[10px] font-semibold tracking-[.15em] uppercase">
                {topArtist ? "Artist" : "Track"}
              </p>
              <h2 className="text-foreground mt-2 truncate text-2xl font-semibold">
                {topArtist?.displayName ?? topTrack?.title}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {topArtist
                  ? topArtist.genres.slice(0, 2).join(" · ")
                  : topTrack?.primaryArtists
                      .map((artist) => artist.displayName)
                      .join(", ")}
              </p>
            </div>
            <PlayButton
              tracks={
                topArtist
                  ? tracks.filter((track) =>
                      [...track.primaryArtists, ...track.featuredArtists].some(
                        (artist) => artist.id === topArtist.id,
                      ),
                    )
                  : topTrack
                    ? [topTrack]
                    : []
              }
              className="absolute right-5 bottom-5"
            />
          </div>
        </section>
      ) : null}

      {results.tracks.length > 0 ? (
        <section>
          <SectionHeader title="Tracks" />
          <TrackList tracks={results.tracks.slice(0, 6)} showHeader={false} />
        </section>
      ) : null}

      {results.artists.length > 0 ? (
        <section>
          <SectionHeader title="Artists" />
          <div className="card-grid">
            {results.artists.slice(0, 5).map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>
      ) : null}

      {results.releases.length > 0 ? (
        <section>
          <SectionHeader title="Releases" />
          <div className="card-grid">
            {results.releases.slice(0, 5).map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
        </section>
      ) : null}

      {results.playlists.length > 0 ? (
        <section>
          <SectionHeader title="Playlists" />
          <div className="card-grid">
            {results.playlists.slice(0, 5).map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
