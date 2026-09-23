"use client";

import { MoreHorizontal, Pause, Play } from "lucide-react";
import { ArtistCredits } from "@/components/artist/artist-link";
import { CoverImage } from "@/components/media/cover-image";
import { LikeButton } from "@/components/player/like-button";
import { Button } from "@/components/ui/button";
import { formatCompactNumber, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";
import type { Track } from "@/types/catalog";

type TrackListProps = {
  tracks: Track[];
  showHeader?: boolean;
  showPlays?: boolean;
  compact?: boolean;
};

export function TrackList({
  tracks,
  showHeader = true,
  showPlays = true,
  compact = false,
}: TrackListProps) {
  const currentTrackId = usePlayerStore((state) => state.currentTrack?.id);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const playTrack = (index: number) => {
    if (tracks[index]?.id === currentTrackId) togglePlay();
    else setQueue(tracks, index);
  };

  return (
    <div className="w-full">
      {showHeader && !compact ? (
        <div className="track-grid border-border text-subtle mb-2 border-b px-3 pb-2 text-[11px] font-medium tracking-[.14em] uppercase">
          <span className="text-center">#</span>
          <span>Title</span>
          {showPlays ? (
            <span className="hidden text-right md:block">Plays</span>
          ) : (
            <span />
          )}
          <span className="text-right">Time</span>
          <span />
        </div>
      ) : null}
      <div className="space-y-0.5">
        {tracks.map((item, index) => {
          const active = item.id === currentTrackId;
          return (
            <div
              key={item.id}
              className="track-grid group hover:bg-surface-hover focus-within:bg-surface-hover items-center rounded-xl px-3 py-2 transition-colors"
            >
              <button
                type="button"
                onClick={() => playTrack(index)}
                className="text-muted-foreground focus-visible:ring-ring grid size-8 place-items-center rounded-full text-xs outline-none focus-visible:ring-2"
                aria-label={`${active && isPlaying ? "Pause" : "Play"} ${item.title}`}
              >
                <span className="group-hover:hidden">
                  {active && isPlaying ? (
                    <span className="playing-bars" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="hidden group-hover:block">
                  {active && isPlaying ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4" />
                  )}
                </span>
              </button>
              <div className="flex min-w-0 items-center gap-3">
                {!compact ? (
                  <CoverImage
                    src={item.cover}
                    alt=""
                    sizes="44px"
                    className="size-11 shrink-0 rounded-lg"
                  />
                ) : null}
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => playTrack(index)}
                    className={`focus-visible:ring-ring block max-w-full truncate rounded-sm text-left text-sm font-medium outline-none hover:underline focus-visible:ring-2 ${active ? "text-primary" : "text-foreground"}`}
                  >
                    {item.title}
                  </button>
                  <div className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                    <ArtistCredits
                      artists={[
                        ...item.primaryArtists,
                        ...item.secondaryArtists,
                      ]}
                      featuredArtists={item.featuredArtists}
                    />
                  </div>
                </div>
              </div>
              {showPlays ? (
                <span className="text-muted-foreground hidden text-right text-xs tabular-nums md:block">
                  {formatCompactNumber(item.playCount)}
                </span>
              ) : (
                <span />
              )}
              <div className="flex items-center justify-end gap-1">
                <LikeButton className="hidden opacity-0 group-focus-within:flex group-focus-within:opacity-100 group-hover:flex sm:flex sm:group-hover:opacity-100" />
                <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                  {formatDuration(item.duration)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
                aria-label={`More options for ${item.title}`}
              >
                <MoreHorizontal />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
