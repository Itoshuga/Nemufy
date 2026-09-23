"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/player-store";

export function GlobalAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const seekVersion = usePlayerStore((state) => state.seekVersion);
  const pause = usePlayerStore((state) => state.pause);
  const next = usePlayerStore((state) => state.next);
  const syncProgress = usePlayerStore((state) => state.syncProgress);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.audioUrl;
    audio.load();
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      void audio.play().catch(() => pause());
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying, pause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = usePlayerStore.getState().currentTime;
  }, [seekVersion]);

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      onTimeUpdate={(event) =>
        syncProgress(
          event.currentTarget.currentTime,
          event.currentTarget.duration || 0,
        )
      }
      onLoadedMetadata={(event) =>
        syncProgress(
          event.currentTarget.currentTime,
          event.currentTarget.duration || 0,
        )
      }
      onEnded={next}
      aria-hidden="true"
    />
  );
}
