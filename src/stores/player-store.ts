import { create } from "zustand";
import type { Track } from "@/types/catalog";

type PlayerState = {
  currentTrack: Track | null;
  queue: Track[];
  currentQueueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  seekVersion: number;
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  playFromQueue: (index: number) => void;
  syncProgress: (currentTime: number, duration: number) => void;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  currentQueueIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.72,
  muted: false,
  seekVersion: 0,
  play: (track) => {
    const queueIndex = get().queue.findIndex((item) => item.id === track.id);
    set({
      currentTrack: track,
      currentQueueIndex: queueIndex,
      isPlaying: true,
      currentTime: 0,
      duration: track.duration,
    });
  },
  pause: () => set({ isPlaying: false }),
  resume: () => {
    if (get().currentTrack) set({ isPlaying: true });
  },
  togglePlay: () => {
    const state = get();
    if (!state.currentTrack) return;
    set({ isPlaying: !state.isPlaying });
  },
  next: () => {
    const { queue, currentQueueIndex } = get();
    if (queue.length === 0) return;
    const nextIndex =
      currentQueueIndex >= 0 ? (currentQueueIndex + 1) % queue.length : 0;
    set({
      currentQueueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      isPlaying: true,
      currentTime: 0,
      duration: queue[nextIndex].duration,
    });
  },
  previous: () => {
    const { queue, currentQueueIndex, currentTime } = get();
    if (currentTime > 3) {
      get().seek(0);
      return;
    }
    if (queue.length === 0) return;
    const previousIndex =
      currentQueueIndex > 0 ? currentQueueIndex - 1 : queue.length - 1;
    set({
      currentQueueIndex: previousIndex,
      currentTrack: queue[previousIndex],
      isPlaying: true,
      currentTime: 0,
      duration: queue[previousIndex].duration,
    });
  },
  seek: (time) =>
    set((state) => ({
      currentTime: clamp(time, 0, state.duration || time),
      seekVersion: state.seekVersion + 1,
    })),
  setVolume: (volume) =>
    set({ volume: clamp(volume, 0, 1), muted: volume === 0 }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  setQueue: (queue, startIndex = 0) => {
    const safeIndex =
      queue.length > 0 ? clamp(startIndex, 0, queue.length - 1) : -1;
    set({
      queue,
      currentQueueIndex: safeIndex,
      currentTrack: safeIndex >= 0 ? queue[safeIndex] : null,
      isPlaying: safeIndex >= 0,
      currentTime: 0,
      duration: safeIndex >= 0 ? queue[safeIndex].duration : 0,
    });
  },
  playFromQueue: (index) => {
    const track = get().queue[index];
    if (!track) return;
    set({
      currentQueueIndex: index,
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: track.duration,
    });
  },
  syncProgress: (currentTime, duration) => set({ currentTime, duration }),
}));
