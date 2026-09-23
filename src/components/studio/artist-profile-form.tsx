"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ImageUp, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadArtistImage,
  type UploadController,
} from "@/lib/firebase/storage/uploads";

type ProfileValue = {
  name: string;
  displayName: string;
  biography: string;
  categoryIds: string[];
  links: { label: string; url: string }[];
  avatarUrl: string | null;
  avatarStoragePath: string | null;
  bannerUrl: string | null;
  bannerStoragePath: string | null;
};

export function ArtistProfileForm({
  artistId,
  value,
  labelId,
}: {
  artistId: string;
  value: ProfileValue;
  labelId?: string;
}) {
  const router = useRouter();
  const uploadRef = useRef<UploadController | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload: ProfileValue = {
      name: String(form.get("name") ?? ""),
      displayName: String(form.get("displayName") ?? ""),
      biography: String(form.get("biography") ?? ""),
      categoryIds: String(form.get("categories") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      links: [
        ["Website", String(form.get("website") ?? "")],
        ["Instagram", String(form.get("instagram") ?? "")],
        ["YouTube", String(form.get("youtube") ?? "")],
      ]
        .filter((entry) => entry[1])
        .map(([label, url]) => ({ label, url })),
      avatarUrl: value.avatarUrl,
      avatarStoragePath: value.avatarStoragePath,
      bannerUrl: value.bannerUrl,
      bannerStoragePath: value.bannerStoragePath,
    };
    const authorization = { artistId, ...(labelId ? { labelId } : {}) };
    try {
      if (avatar) {
        const controller = await uploadArtistImage(
          "avatar",
          artistId,
          avatar,
          authorization,
          (state) => setProgress(state.percent),
        );
        uploadRef.current = controller;
        const result = await controller.promise;
        payload.avatarUrl = result.downloadUrl;
        payload.avatarStoragePath = result.storagePath;
      }
      if (banner) {
        const controller = await uploadArtistImage(
          "banner",
          artistId,
          banner,
          authorization,
          (state) => setProgress(state.percent),
        );
        uploadRef.current = controller;
        const result = await controller.promise;
        payload.bannerUrl = result.downloadUrl;
        payload.bannerStoragePath = result.storagePath;
      }
      const response = await fetch(`/api/studio/artists/${artistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(responsePayload.message ?? "Profile update failed.");
      setMessage("Artist profile saved.");
      setAvatar(null);
      setBanner(null);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Profile update failed.",
      );
    } finally {
      uploadRef.current = null;
      setProgress(null);
      setPending(false);
    }
  }

  const link = (label: string) =>
    value.links.find((item) => item.label.toLowerCase() === label)?.url ?? "";
  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      <section className="border-border bg-surface grid gap-5 rounded-2xl border p-5 lg:grid-cols-2">
        <label className="text-xs font-medium">
          Artist name
          <input
            name="name"
            defaultValue={value.name}
            required
            className="border-border bg-background focus:border-primary mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="text-xs font-medium">
          Display name
          <input
            name="displayName"
            defaultValue={value.displayName}
            required
            className="border-border bg-background focus:border-primary mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="text-xs font-medium lg:col-span-2">
          Biography
          <textarea
            name="biography"
            defaultValue={value.biography}
            rows={7}
            maxLength={4000}
            className="border-border bg-background focus:border-primary mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
          />
        </label>
        <label className="text-xs font-medium lg:col-span-2">
          Categories <span className="text-subtle">(comma separated IDs)</span>
          <input
            name="categories"
            defaultValue={value.categoryIds.join(", ")}
            className="border-border bg-background focus:border-primary mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
          />
        </label>
      </section>
      <section className="border-border bg-surface grid gap-5 rounded-2xl border p-5 lg:grid-cols-2">
        <MediaField
          label="Avatar · JPEG, PNG or WEBP · min. 512 × 512"
          value={avatar}
          onChange={setAvatar}
        />
        <MediaField
          label="Banner · JPEG, PNG or WEBP · min. 1200 × 400"
          value={banner}
          onChange={setBanner}
        />
      </section>
      <section className="border-border bg-surface grid gap-5 rounded-2xl border p-5 lg:grid-cols-3">
        <label className="text-xs font-medium">
          Website
          <input
            name="website"
            type="url"
            defaultValue={link("website")}
            className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium">
          Instagram
          <input
            name="instagram"
            type="url"
            defaultValue={link("instagram")}
            className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium">
          YouTube
          <input
            name="youtube"
            type="url"
            defaultValue={link("youtube")}
            className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
          />
        </label>
      </section>
      {progress !== null && (
        <div className="border-border bg-surface rounded-xl border p-4">
          <div className="flex justify-between text-xs">
            <span>Uploading media</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => uploadRef.current?.cancel()}
          >
            <X />
            Cancel upload
          </Button>
        </div>
      )}
      <div className="flex items-center gap-4">
        <Button disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />}Save profile
        </Button>
        {message && (
          <p className="text-muted-foreground text-sm" role="status">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}

function MediaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: File | null;
  onChange(file: File | null): void;
}) {
  return (
    <label className="border-border bg-background hover:border-primary/40 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center">
      <ImageUp className="text-primary size-5" />
      <span className="mt-3 text-xs font-medium">{value?.name ?? label}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
