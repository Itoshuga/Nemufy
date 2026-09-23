"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImageUp, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadReleaseCover,
  type UploadController,
} from "@/lib/firebase/storage/uploads";

export function ReleaseCoverUpload({
  artistId,
  releaseId,
  labelId,
}: {
  artistId: string;
  releaseId: string;
  labelId?: string;
}) {
  const router = useRouter();
  const controllerRef = useRef<UploadController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function upload() {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const controller = await uploadReleaseCover(
        releaseId,
        file,
        { artistId, ...(labelId ? { labelId } : {}) },
        (state) => setProgress(state.percent),
      );
      controllerRef.current = controller;
      const result = await controller.promise;
      const response = await fetch(
        `/api/studio/artists/${artistId}/releases/${releaseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "artwork",
            coverUrl: result.downloadUrl,
            coverStoragePath: result.storagePath,
          }),
        },
      );
      const payload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(payload.message ?? "Artwork could not be saved.");
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Artwork upload failed.",
      );
    } finally {
      setPending(false);
      setProgress(null);
      controllerRef.current = null;
    }
  }
  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <p className="font-semibold">Release artwork</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Square JPEG, PNG or WEBP · minimum 1000 × 1000
      </p>
      <label className="border-border bg-background hover:border-primary/40 mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4">
        <ImageUp className="text-primary size-5" />
        <span className="min-w-0 truncate text-sm">
          {file?.name ?? "Choose a cover"}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setFile(nextFile);
            setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
          }}
        />
      </label>
      {previewUrl && (
        <div
          role="img"
          aria-label="Selected release cover preview"
          className="border-border mt-4 aspect-square max-w-48 rounded-2xl border bg-cover bg-center"
          style={{ backgroundImage: `url(${previewUrl})` }}
        />
      )}
      {progress !== null && (
        <div className="mt-4">
          <div className="flex justify-between text-xs">
            <span>Uploading</span>
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
      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={upload}
          disabled={!file || pending}
        >
          {pending && <LoaderCircle className="animate-spin" />}Upload cover
        </Button>
        {pending && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => controllerRef.current?.cancel()}
          >
            <X />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
