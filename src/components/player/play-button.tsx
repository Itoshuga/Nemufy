"use client";

import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/player-store";
import type { Track } from "@/types/catalog";
import { cn } from "@/lib/utils";

type PlayButtonProps = {
  tracks: Track[];
  startIndex?: number;
  className?: string;
  size?: "sm" | "default" | "lg";
  label?: boolean;
};

export function PlayButton({
  tracks,
  startIndex = 0,
  className,
  size = "default",
  label = false,
}: PlayButtonProps) {
  const currentTrackId = usePlayerStore((state) => state.currentTrack?.id);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const selectedTrack = tracks[startIndex];
  const isActive = selectedTrack?.id === currentTrackId;

  const handleClick = () => {
    if (!selectedTrack) return;
    if (isActive) togglePlay();
    else setQueue(tracks, startIndex);
  };

  const icon =
    isActive && isPlaying ? (
      <Pause aria-hidden="true" />
    ) : (
      <Play className="translate-x-px" aria-hidden="true" />
    );

  if (label) {
    return (
      <Button
        size={size === "lg" ? "lg" : "default"}
        onClick={handleClick}
        disabled={!selectedTrack}
        className={className}
        aria-label={isActive && isPlaying ? "Pause" : "Play"}
      >
        {icon}
        {isActive && isPlaying ? "Pause" : "Play"}
      </Button>
    );
  }

  return (
    <Button
      size={size === "lg" ? "icon-lg" : size === "sm" ? "icon-sm" : "icon"}
      onClick={handleClick}
      disabled={!selectedTrack}
      className={cn("shadow-xl", className)}
      aria-label={isActive && isPlaying ? "Pause" : "Play"}
    >
      {icon}
    </Button>
  );
}
