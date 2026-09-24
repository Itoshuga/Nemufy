"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  LoaderCircle,
  Pencil,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadTrackCover,
  type UploadController,
} from "@/lib/firebase/storage/uploads";

type EditableTrack = {
  id: string;
  title: string;
  primaryArtistIds: string[];
  featuredArtistIds: string[];
  categoryIds: string[];
  tags: string[];
  explicit: boolean;
  status: string;
};

export function TrackActions({
  artistId,
  releaseId,
  track,
  orderedTrackIds,
  canEdit,
  canDelete,
  labelId,
  primaryArtistName = "Primary artist",
  artistOptions = [],
  categoryOptions = [],
}: {
  artistId: string;
  releaseId: string;
  track: EditableTrack;
  orderedTrackIds: string[];
  canEdit: boolean;
  canDelete: boolean;
  labelId?: string;
  primaryArtistName?: string;
  artistOptions?: Array<{ id: string; name: string }>;
  categoryOptions?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const uploadController = useRef<UploadController | null>(null);
  const index = orderedTrackIds.indexOf(track.id);

  async function request(method: "PATCH" | "DELETE", body: unknown) {
    const response = await fetch(`/api/studio/artists/${artistId}/tracks`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? "Track update failed.");
    }
    router.refresh();
  }

  async function move(offset: -1 | 1) {
    const destination = index + offset;
    if (index < 0 || destination < 0 || destination >= orderedTrackIds.length)
      return;
    const ordered = [...orderedTrackIds];
    [ordered[index], ordered[destination]] = [
      ordered[destination],
      ordered[index],
    ];
    setPending(offset === -1 ? "up" : "down");
    setError(null);
    try {
      await request("PATCH", {
        action: "reorder",
        releaseId,
        orderedTrackIds: ordered,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reorder failed.");
    } finally {
      setPending(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending("edit");
    setError(null);
    try {
      await request("PATCH", {
        action: "update",
        trackId: track.id,
        data: {
          title: form.get("title"),
          primaryArtistIds: track.primaryArtistIds,
          featuredArtistIds:
            artistOptions.length > 0
              ? form.getAll("featuredArtistIds").map(String)
              : track.featuredArtistIds,
          categoryIds:
            categoryOptions.length > 0
              ? form.getAll("categoryIds").map(String)
              : track.categoryIds,
          tags: splitIds(form.get("tags")),
          explicit: form.get("explicit") === "on",
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Update failed.");
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    if (!window.confirm("Remove this draft track from the release?")) return;
    setPending("remove");
    setError(null);
    try {
      await request("DELETE", { trackId: track.id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Removal failed.");
    } finally {
      setPending(null);
    }
  }

  async function uploadCover() {
    if (!coverFile) return;
    setPending("cover");
    setError(null);
    try {
      const controller = await uploadTrackCover(
        track.id,
        coverFile,
        { artistId, ...(labelId ? { labelId } : {}) },
        ({ percent }) => setCoverProgress(percent),
      );
      uploadController.current = controller;
      const result = await controller.promise;
      await request("PATCH", {
        action: "artwork",
        trackId: track.id,
        coverUrl: result.downloadUrl,
        coverStoragePath: result.storagePath,
      });
      setCoverFile(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Track cover upload failed.",
      );
    } finally {
      uploadController.current = null;
      setCoverProgress(null);
      setPending(null);
    }
  }

  return (
    <div className="min-w-52">
      <div className="flex gap-1">
        {canEdit && (
          <>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Move track up"
              disabled={pending !== null || index <= 0}
              onClick={() => move(-1)}
            >
              {pending === "up" ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ArrowUp />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Move track down"
              disabled={
                pending !== null || index === orderedTrackIds.length - 1
              }
              onClick={() => move(1)}
            >
              {pending === "down" ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ArrowDown />
              )}
            </Button>
          </>
        )}
        {canDelete && track.status === "draft" && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Remove draft track"
            disabled={pending !== null}
            onClick={remove}
          >
            {pending === "remove" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Trash2 />
            )}
          </Button>
        )}
      </div>
      {canEdit && (
        <details className="mt-2">
          <summary className="text-primary flex cursor-pointer items-center gap-1 text-xs">
            <Pencil className="size-3" /> Edit metadata
          </summary>
          <form onSubmit={submit} className="mt-3 grid gap-2">
            <input
              name="title"
              defaultValue={track.title}
              required
              aria-label="Track title"
              className="border-border bg-background rounded-lg border px-2 py-1.5 text-xs"
            />
            <div className="border-border bg-background rounded-lg border px-2 py-2 text-xs">
              <span className="text-subtle block text-[9px] font-semibold uppercase">
                Primary artist
              </span>
              <span className="mt-1 block font-medium">
                {primaryArtistName}
              </span>
            </div>
            {artistOptions.filter((option) => option.id !== artistId).length >
              0 && (
              <fieldset className="grid gap-1">
                <legend className="text-subtle text-[10px] font-semibold uppercase">
                  Featuring
                </legend>
                {artistOptions
                  .filter((option) => option.id !== artistId)
                  .map((option) => (
                    <label
                      key={option.id}
                      className="border-border bg-background flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs"
                    >
                      <input
                        type="checkbox"
                        name="featuredArtistIds"
                        value={option.id}
                        defaultChecked={track.featuredArtistIds.includes(
                          option.id,
                        )}
                      />
                      {option.name}
                    </label>
                  ))}
              </fieldset>
            )}
            {categoryOptions.length > 0 && (
              <fieldset className="grid gap-1 sm:grid-cols-2">
                <legend className="text-subtle col-span-full text-[10px] font-semibold uppercase">
                  Categories
                </legend>
                {categoryOptions.map((option) => (
                  <label
                    key={option.id}
                    className="border-border bg-background flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs"
                  >
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={option.id}
                      defaultChecked={track.categoryIds.includes(option.id)}
                    />
                    {option.name}
                  </label>
                ))}
              </fieldset>
            )}
            <input
              name="tags"
              defaultValue={track.tags.join(", ")}
              aria-label="Tags"
              placeholder="Tags"
              className="border-border bg-background rounded-lg border px-2 py-1.5 text-xs"
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                name="explicit"
                type="checkbox"
                defaultChecked={track.explicit}
              />
              Explicit
            </label>
            <Button size="sm" disabled={pending !== null}>
              {pending === "edit" ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Save />
              )}
              Save
            </Button>
            <label className="border-border bg-background flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-2 py-2 text-xs">
              <Upload className="size-3" />
              <span className="truncate">
                {coverFile?.name ?? "Optional custom cover"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) =>
                  setCoverFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            {coverProgress !== null && (
              <div className="bg-muted h-1.5 rounded-full">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${coverProgress}%` }}
                />
              </div>
            )}
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!coverFile || pending !== null}
                onClick={uploadCover}
              >
                {pending === "cover" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Upload />
                )}
                Upload cover
              </Button>
              {pending === "cover" && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Cancel track cover upload"
                  onClick={() => uploadController.current?.cancel()}
                >
                  <X />
                </Button>
              )}
            </div>
          </form>
        </details>
      )}
      {error && (
        <p className="mt-2 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function splitIds(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
