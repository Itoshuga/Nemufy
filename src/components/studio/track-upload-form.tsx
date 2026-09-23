"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { FileAudio, LoaderCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadTrackAudio,
  type UploadController,
} from "@/lib/firebase/storage/uploads";

async function readAudioDuration(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<number>((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () =>
        resolve(Math.max(1, Math.round(audio.duration)));
      audio.onerror = () =>
        reject(new Error("Audio metadata could not be read."));
      audio.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function TrackUploadForm({
  artistId,
  releaseId,
  nextTrackNumber,
  labelId,
}: {
  artistId: string;
  releaseId: string;
  nextTrackNumber: number;
  labelId?: string;
}) {
  const router = useRouter();
  const controllerRef = useRef<UploadController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose an audio file first.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const trackId = crypto.randomUUID();
    setPending(true);
    setError(null);
    try {
      const durationSeconds = await readAudioDuration(file);
      const controller = uploadTrackAudio(
        trackId,
        file,
        { artistId, releaseId, ...(labelId ? { labelId } : {}) },
        (state) => setProgress(state.percent),
      );
      controllerRef.current = controller;
      const upload = await controller.promise;
      const response = await fetch(`/api/studio/artists/${artistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId,
          releaseId,
          title: form.get("title"),
          primaryArtistIds: [artistId],
          featuredArtistIds: String(form.get("featuredArtistIds") ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          durationSeconds,
          trackNumber: Number(form.get("trackNumber")),
          explicit: form.get("explicit") === "on",
          categoryIds: String(form.get("categories") ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          tags: String(form.get("tags") ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          audioUrl: upload.downloadUrl,
          audioStoragePath: upload.storagePath,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(
          payload.message ?? "Track metadata could not be saved.",
        );
      event.currentTarget.reset();
      setFile(null);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Track upload failed.",
      );
    } finally {
      controllerRef.current = null;
      setPending(false);
      setProgress(null);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="border-border bg-surface rounded-2xl border p-5"
    >
      <div className="flex items-center gap-3">
        <span className="bg-primary/12 text-primary grid size-10 place-items-center rounded-xl">
          <FileAudio className="size-5" />
        </span>
        <div>
          <p className="font-semibold">Add track</p>
          <p className="text-muted-foreground text-xs">
            Upload first, then persist validated metadata.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium">
          Title
          <input
            name="title"
            required
            className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium">
          Track number
          <input
            name="trackNumber"
            type="number"
            min={1}
            max={999}
            defaultValue={nextTrackNumber}
            required
            className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium">
          Featured artist IDs
          <input
            name="featuredArtistIds"
            className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium">
          Categories
          <input
            name="categories"
            className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium sm:col-span-2">
          Tags
          <input
            name="tags"
            className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
          />
        </label>
      </div>
      <label className="border-border bg-background hover:border-primary/40 mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4">
        <Upload className="text-primary size-5" />
        <span className="truncate text-sm">
          {file?.name ?? "MP3, WAV, FLAC, MP4 or M4A · max 500 MB"}
        </span>
        <input
          type="file"
          accept="audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/x-m4a"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input name="explicit" type="checkbox" /> Explicit content
      </label>
      {progress !== null && (
        <div className="mt-4">
          <div className="flex justify-between text-xs">
            <span>Uploading audio</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-muted mt-2 h-2 rounded-full">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {error && (
        <p className="mt-3 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <Button disabled={pending || !file}>
          {pending && <LoaderCircle className="animate-spin" />}Upload & add
          track
        </Button>
        {pending && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => controllerRef.current?.cancel()}
          >
            <X />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
