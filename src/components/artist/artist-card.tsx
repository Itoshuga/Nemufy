import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { Artist, Track } from "@/types/catalog";
import { CoverImage } from "@/components/media/cover-image";
import { PlayButton } from "@/components/player/play-button";
import { getPopularTracksByArtistId } from "@/data/mock/selectors";

export function ArtistCard({
  artist,
  tracks,
}: {
  artist: Artist;
  tracks?: Track[];
}) {
  const artistTracks = getPopularTracksByArtistId(artist.id, tracks);

  return (
    <article className="group min-w-0 text-center sm:text-left">
      <div className="relative mb-3.5">
        <Link
          href={`/artist/${artist.slug}`}
          aria-label={`Open ${artist.displayName}`}
          className="ring-offset-background focus-visible:ring-ring block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <CoverImage
            src={artist.avatar}
            alt={artist.displayName}
            className="aspect-square rounded-full shadow-[0_16px_45px_rgba(0,0,0,.25)] transition duration-300 group-hover:-translate-y-1"
          />
        </Link>
        <PlayButton
          tracks={artistTracks}
          className="absolute right-[8%] bottom-[5%] translate-y-2 opacity-0 transition-all duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
        />
      </div>
      <Link
        href={`/artist/${artist.slug}`}
        className="text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-2"
      >
        {artist.displayName}
        {artist.verified ? (
          <BadgeCheck
            className="fill-primary text-background size-3.5"
            aria-label="Verified"
          />
        ) : null}
      </Link>
      <p className="text-muted-foreground mt-1 text-xs">Artist</p>
    </article>
  );
}
