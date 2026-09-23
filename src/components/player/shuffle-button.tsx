"use client";

import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/player-store";
import type { Track } from "@/types/catalog";

export function ShuffleButton({ tracks }: { tracks: Track[] }) {
  const setQueue = usePlayerStore((state) => state.setQueue);

  const shuffle = () => {
    const shuffled = [...tracks];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }
    setQueue(shuffled, 0);
  };

  return (
    <Button
      variant="secondary"
      onClick={shuffle}
      disabled={tracks.length === 0}
    >
      <Shuffle aria-hidden="true" />
      Shuffle
    </Button>
  );
}
