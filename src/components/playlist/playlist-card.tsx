import Link from "next/link";
import type { Playlist } from "@/types/catalog";
import { CoverImage } from "@/components/media/cover-image";
import { PlayButton } from "@/components/player/play-button";

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <article className="group min-w-0">
      <div className="relative mb-3.5">
        <Link
          href={`/playlist/${playlist.slug}`}
          aria-label={`Open ${playlist.title}`}
          className="ring-offset-background focus-visible:ring-ring block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <CoverImage
            src={playlist.cover}
            alt={`${playlist.title} cover`}
            className="aspect-square rounded-2xl shadow-[0_16px_45px_rgba(0,0,0,.22)] transition duration-300 group-hover:-translate-y-1"
          />
        </Link>
        <PlayButton
          tracks={playlist.tracks}
          className="absolute right-3 bottom-3 translate-y-2 opacity-0 transition-all duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
        />
      </div>
      <Link
        href={`/playlist/${playlist.slug}`}
        className="text-foreground focus-visible:ring-ring line-clamp-1 rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-2"
      >
        {playlist.title}
      </Link>
      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
        {playlist.description}
      </p>
    </article>
  );
}
