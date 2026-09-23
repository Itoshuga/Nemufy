"use client";

import {
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { CSSProperties } from "react";
import { ArtistCredits } from "@/components/artist/artist-link";
import { CoverImage } from "@/components/media/cover-image";
import { LikeButton } from "@/components/player/like-button";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";

export function Player() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const queueLength = usePlayerStore((state) => state.queue.length);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const previous = usePlayerStore((state) => state.previous);
  const next = usePlayerStore((state) => state.next);
  const seek = usePlayerStore((state) => state.seek);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);

  if (!currentTrack) {
    return (
      <div className="player-shell player-empty">
        <div className="text-muted-foreground flex items-center gap-3">
          <span className="bg-surface-hover grid size-11 place-items-center rounded-xl">
            <Play className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-foreground text-sm font-medium">
              Ready when you are
            </p>
            <p className="text-xs">Choose something quiet to begin</p>
          </div>
        </div>
        <p className="text-subtle hidden text-xs md:block">
          Headphones recommended
        </p>
      </div>
    );
  }

  const volumeIcon =
    muted || volume === 0 ? VolumeX : volume < 0.55 ? Volume1 : Volume2;
  const VolumeIcon = volumeIcon;

  return (
    <div className="player-shell">
      <div className="player-track min-w-0">
        <CoverImage
          src={currentTrack.cover}
          alt=""
          sizes="56px"
          className="size-12 shrink-0 rounded-xl sm:size-14"
        />
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold">
            {currentTrack.title}
          </p>
          <div className="text-muted-foreground truncate text-xs">
            <ArtistCredits
              artists={[
                ...currentTrack.primaryArtists,
                ...currentTrack.secondaryArtists,
              ]}
              featuredArtists={currentTrack.featuredArtists}
            />
          </div>
        </div>
        <LikeButton className="hidden sm:inline-flex" />
      </div>

      <div className="player-controls">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={previous}
            disabled={queueLength === 0}
            aria-label="Previous track"
            className="hidden sm:inline-flex"
          >
            <SkipBack />
          </Button>
          <Button
            size="icon"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause /> : <Play className="translate-x-px" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={next}
            disabled={queueLength === 0}
            aria-label="Next track"
            className="hidden sm:inline-flex"
          >
            <SkipForward />
          </Button>
        </div>
        <div className="hidden w-full items-center gap-2 sm:flex">
          <span className="text-subtle w-9 text-right text-[10px] tabular-nums">
            {formatDuration(currentTime)}
          </span>
          <input
            className="range-input flex-1"
            type="range"
            min={0}
            max={Math.max(duration, 0)}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Track progress"
            style={
              {
                "--range-progress": `${duration ? (currentTime / duration) * 100 : 0}%`,
              } as CSSProperties
            }
          />
          <span className="text-subtle w-9 text-[10px] tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      <div className="player-volume hidden items-center justify-end gap-1 lg:flex">
        <Button variant="ghost" size="icon-sm" aria-label="Open queue">
          <ListMusic />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <VolumeIcon />
        </Button>
        <input
          className="range-input w-24"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume"
          style={
            {
              "--range-progress": `${(muted ? 0 : volume) * 100}%`,
            } as CSSProperties
          }
        />
      </div>
    </div>
  );
}
