import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, MoreHorizontal } from "lucide-react";
import { ArtistCard } from "@/components/artist/artist-card";
import { FollowButton } from "@/components/artist/follow-button";
import { CoverImage } from "@/components/media/cover-image";
import { PlayButton } from "@/components/player/play-button";
import { ReleaseCard } from "@/components/release/release-card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/home/section-header";
import { TrackList } from "@/components/track/track-list";
import { artists } from "@/data/mock/catalog";
import { getCatalog } from "@/data/catalog";
import {
  getAppearancesByArtistId,
  getArtistBySlug,
  getPopularTracksByArtistId,
  getReleasesByArtistId,
} from "@/data/mock/selectors";
import { formatCompactNumber } from "@/lib/utils";

type ArtistPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return artists.map((artist) => ({ slug: artist.slug }));
}

export async function generateMetadata({
  params,
}: ArtistPageProps): Promise<Metadata> {
  const catalog = await getCatalog();
  const artist = getArtistBySlug((await params).slug, catalog.artists);
  return artist
    ? { title: artist.displayName, description: artist.bio }
    : { title: "Artist not found" };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const catalog = await getCatalog();
  const artist = getArtistBySlug((await params).slug, catalog.artists);
  if (!artist) notFound();

  const popularTracks = getPopularTracksByArtistId(artist.id, catalog.tracks);
  const artistReleases = getReleasesByArtistId(
    artist.id,
    catalog.releases,
  ).sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
  const appearances = getAppearancesByArtistId(artist.id, catalog.releases);
  const relatedArtists = catalog.artists
    .filter(
      (candidate) =>
        candidate.id !== artist.id &&
        candidate.genres.some((genre) => artist.genres.includes(genre)),
    )
    .slice(0, 5);

  return (
    <div className="page-container artist-page">
      <section className="artist-hero">
        <CoverImage
          src={artist.banner}
          alt=""
          priority
          sizes="(max-width: 768px) 100vw, 80vw"
          className="absolute inset-0"
        />
        <div className="from-background via-background/30 absolute inset-0 bg-gradient-to-t to-black/10" />
        <div className="relative z-10 flex items-end gap-5">
          <CoverImage
            src={artist.avatar}
            alt={artist.displayName}
            priority
            sizes="160px"
            className="border-background hidden size-36 shrink-0 rounded-full border-4 shadow-2xl sm:block"
          />
          <div className="min-w-0 pb-1">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/75">
              {artist.verified ? (
                <BadgeCheck
                  className="fill-primary text-background size-4"
                  aria-hidden="true"
                />
              ) : null}
              {artist.verified ? "Verified artist" : "Artist"}
            </div>
            <h1 className="font-display text-5xl font-semibold tracking-[-.05em] text-white sm:text-6xl lg:text-7xl">
              {artist.displayName}
            </h1>
            <p className="mt-3 text-sm text-white/70">
              {formatCompactNumber(artist.monthlyListeners)} monthly listeners
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 flex items-center gap-3">
        <PlayButton tracks={popularTracks} size="lg" />
        <FollowButton />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`More options for ${artist.displayName}`}
        >
          <MoreHorizontal />
        </Button>
      </div>

      <section className="page-section !mt-10">
        <SectionHeader title="Popular" />
        <TrackList tracks={popularTracks.slice(0, 5)} showHeader={false} />
      </section>

      {artistReleases[0] ? (
        <section className="page-section">
          <SectionHeader title="Latest release" />
          <div className="max-w-48">
            <ReleaseCard release={artistReleases[0]} />
          </div>
        </section>
      ) : null}

      {artistReleases.length > 0 ? (
        <section className="page-section">
          <SectionHeader title="Discography" />
          <div className="card-grid">
            {artistReleases.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
        </section>
      ) : null}

      {appearances.length > 0 ? (
        <section className="page-section">
          <SectionHeader title="Appears on" />
          <div className="card-grid">
            {appearances.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="page-section grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          <SectionHeader title="About" />
          <div className="border-border bg-surface rounded-3xl border p-6 sm:p-8">
            <p className="text-muted-foreground max-w-2xl text-sm leading-7">
              {artist.bio}
            </p>
            <div className="mt-6 flex gap-8">
              <div>
                <p className="text-foreground text-lg font-semibold">
                  {formatCompactNumber(artist.followerCount)}
                </p>
                <p className="text-muted-foreground text-xs">followers</p>
              </div>
              <div>
                <p className="text-foreground text-lg font-semibold">
                  {formatCompactNumber(artist.monthlyListeners)}
                </p>
                <p className="text-muted-foreground text-xs">
                  monthly listeners
                </p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <SectionHeader title="Sounds like" />
          <div className="flex flex-wrap gap-2">
            {artist.genres.map((genre) => (
              <span
                key={genre}
                className="border-border bg-surface text-muted-foreground rounded-full border px-3 py-2 text-xs"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </section>

      {relatedArtists.length > 0 ? (
        <section className="page-section">
          <SectionHeader title="Listeners also love" />
          <div className="card-grid">
            {relatedArtists.map((relatedArtist) => (
              <ArtistCard
                key={relatedArtist.id}
                artist={relatedArtist}
                tracks={catalog.tracks}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
