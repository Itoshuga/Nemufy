"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  Check,
  ChevronDown,
  FileAudio,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
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
  primaryArtistName = "Primary artist",
  artistOptions = [],
  categoryOptions = [],
}: {
  artistId: string;
  releaseId: string;
  nextTrackNumber: number;
  labelId?: string;
  primaryArtistName?: string;
  artistOptions?: Array<{ id: string; name: string }>;
  categoryOptions?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const controllerRef = useRef<UploadController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose an audio file first.");
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const trackId = crypto.randomUUID();
    setPending(true);
    setComplete(false);
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
          featuredArtistIds: form.getAll("featuredArtistIds").map(String),
          durationSeconds,
          trackNumber: Number(form.get("trackNumber")),
          explicit: form.get("explicit") === "on",
          categoryIds: form.getAll("categoryIds").map(String),
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
      formElement.reset();
      setFile(null);
      setComplete(true);
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
    <form onSubmit={submit} className="space-y-5">
      <label className="border-border bg-background hover:border-primary/45 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center">
        <Upload className="text-primary size-6" />
        <span className="mt-3 text-sm font-medium">
          {file?.name ?? "Drop audio file here"}
        </span>
        <span className="text-subtle mt-1 text-xs">
          or choose MP3, WAV, FLAC, MP4 or M4A
        </span>
        <input
          type="file"
          accept="audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/x-m4a"
          className="sr-only"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setComplete(false);
          }}
        />
      </label>

      {progress !== null ? (
        <div>
          <div className="flex justify-between text-xs">
            <span>Uploading {file?.name}</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-muted mt-2 h-2 rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : complete ? (
        <p className="flex items-center gap-2 text-xs text-emerald-300">
          <Check className="size-4" /> Track added.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
        <Field label="Title">
          <input name="title" required className="manage-input" />
        </Field>
        <Field label="Number">
          <input
            name="trackNumber"
            type="number"
            min={1}
            max={999}
            defaultValue={nextTrackNumber}
            required
            className="manage-input"
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium">Artists</p>
        <div className="border-border bg-background rounded-xl border p-3">
          <span className="text-subtle text-[9px] font-semibold tracking-wide uppercase">
            Primary
          </span>
          <p className="mt-1 text-sm font-medium">{primaryArtistName}</p>
        </div>
        {artistOptions.filter((artist) => artist.id !== artistId).length > 0 ? (
          <fieldset className="mt-3">
            <legend className="mb-2 text-xs font-medium">Featuring</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {artistOptions
                .filter((artist) => artist.id !== artistId)
                .map((artist) => (
                  <label
                    key={artist.id}
                    className="border-border bg-background flex items-center gap-3 rounded-xl border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="featuredArtistIds"
                      value={artist.id}
                    />{" "}
                    {artist.name}
                  </label>
                ))}
            </div>
          </fieldset>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input name="explicit" type="checkbox" /> Explicit content
      </label>

      <details className="border-border rounded-xl border p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
          Advanced settings{" "}
          <ChevronDown className="text-muted-foreground size-4" />
        </summary>
        <div className="mt-4 space-y-4">
          {categoryOptions.length > 0 ? (
            <fieldset>
              <legend className="mb-2 text-xs font-medium">Categories</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {categoryOptions.map((category) => (
                  <label
                    key={category.id}
                    className="border-border bg-background flex items-center gap-2 rounded-lg border p-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={category.id}
                    />{" "}
                    {category.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <Field label="Tags">
            <input
              name="tags"
              className="manage-input"
              placeholder="sleep, rain, whisper"
            />
          </Field>
        </div>
      </details>

      {error ? (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button disabled={pending || !file}>
          {pending ? <LoaderCircle className="animate-spin" /> : <FileAudio />}
          {pending ? "Uploading…" : "Add track"}
        </Button>
        {pending ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => controllerRef.current?.cancel()}
          >
            <X /> Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
