import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import type { Playlist, Release } from "@/types/catalog";
import { ArtistCredits } from "@/components/artist/artist-link";
import { CoverImage } from "@/components/media/cover-image";
import { LikeButton } from "@/components/player/like-button";
import { PlayButton } from "@/components/player/play-button";
import { ShuffleButton } from "@/components/player/shuffle-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTotalDuration } from "@/lib/utils";

export function ReleaseHeader({ release }: { release: Release }) {
  return (
    <CollectionHeader
      artwork={release.cover}
      eyebrow={release.type}
      title={release.title}
      description={release.description}
      meta={
        <>
          <ArtistCredits
            artists={release.artists}
            className="text-foreground font-semibold"
          />
          <span>·</span>
          <span>{new Date(release.releaseDate).getFullYear()}</span>
          <span>·</span>
          <span>{release.tracks.length} tracks</span>
          <span>·</span>
          <span>{formatTotalDuration(release.duration)}</span>
        </>
      }
      tracks={release.tracks}
    />
  );
}

export function PlaylistHeader({ playlist }: { playlist: Playlist }) {
  const duration = playlist.tracks.reduce(
    (sum, track) => sum + track.duration,
    0,
  );
  return (
    <CollectionHeader
      artwork={playlist.cover}
      eyebrow="Playlist"
      title={playlist.title}
      description={playlist.description}
      meta={
        <>
          <span className="text-foreground font-semibold">
            {playlist.creator.name}
          </span>
          <span>·</span>
          <span>{playlist.tracks.length} tracks</span>
          <span>·</span>
          <span>{formatTotalDuration(duration)}</span>
        </>
      }
      tracks={playlist.tracks}
    />
  );
}

function CollectionHeader({
  artwork,
  eyebrow,
  title,
  description,
  meta,
  tracks,
}: {
  artwork: string;
  eyebrow: string;
  title: string;
  description?: string;
  meta: ReactNode;
  tracks: Release["tracks"];
}) {
  return (
    <section className="collection-header">
      <CoverImage
        src={artwork}
        alt={`${title} cover`}
        priority
        sizes="(max-width: 640px) 200px, 260px"
        className="collection-cover"
      />
      <div className="min-w-0 flex-1">
        <Badge className="mb-4">{eyebrow}</Badge>
        <h1 className="font-display text-foreground text-4xl font-semibold tracking-[-.045em] text-balance sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
            {description}
          </p>
        ) : null}
        <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-1.5 text-xs">
          {meta}
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <PlayButton tracks={tracks} label size="lg" />
          <ShuffleButton tracks={tracks} />
          <LikeButton className="border-border bg-surface size-10 border" />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`More options for ${title}`}
          >
            <MoreHorizontal />
          </Button>
        </div>
      </div>
    </section>
  );
}
