"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const fieldClassName =
  "border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm";

export function ReleaseMetadataForm({
  artistId,
  releaseId,
  initial,
}: {
  artistId: string;
  releaseId: string;
  initial: {
    title: string;
    type: "single" | "ep" | "album";
    releaseDate: string;
    description: string;
    copyright: string;
    explicit: boolean;
    primaryArtistIds: string[];
    featuredArtistIds: string[];
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(
        `/api/studio/artists/${artistId}/releases/${releaseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            data: {
              title: form.get("title"),
              type: form.get("type"),
              releaseDate: form.get("releaseDate"),
              description: form.get("description"),
              copyright: form.get("copyright"),
              explicit: form.get("explicit") === "on",
              primaryArtistIds: splitIds(form.get("primaryArtistIds")),
              featuredArtistIds: splitIds(form.get("featuredArtistIds")),
            },
          }),
        },
      );
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(
          payload.message ?? "Release metadata could not be saved.",
        );
      }
      setMessage("Release metadata saved.");
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Release metadata could not be saved.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="border-border bg-surface mt-8 rounded-2xl border p-6">
      <summary className="cursor-pointer font-semibold">
        Edit release metadata
      </summary>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input
            name="title"
            defaultValue={initial.title}
            required
            className={fieldClassName}
          />
        </Field>
        <Field label="Type">
          <select
            name="type"
            defaultValue={initial.type}
            className={fieldClassName}
          >
            <option value="single">Single</option>
            <option value="ep">EP</option>
            <option value="album">Album</option>
          </select>
        </Field>
        <Field label="Release date">
          <input
            name="releaseDate"
            type="date"
            defaultValue={initial.releaseDate}
            required
            className={fieldClassName}
          />
        </Field>
        <Field label="Copyright">
          <input
            name="copyright"
            defaultValue={initial.copyright}
            className={fieldClassName}
          />
        </Field>
        <Field label="Primary artist IDs">
          <input
            name="primaryArtistIds"
            defaultValue={initial.primaryArtistIds.join(", ")}
            required
            className={fieldClassName}
          />
        </Field>
        <Field label="Featured artist IDs">
          <input
            name="featuredArtistIds"
            defaultValue={initial.featuredArtistIds.join(", ")}
            className={fieldClassName}
          />
        </Field>
        <label className="text-xs font-medium sm:col-span-2">
          Description
          <textarea
            name="description"
            defaultValue={initial.description}
            rows={5}
            className={fieldClassName}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="explicit"
            type="checkbox"
            defaultChecked={initial.explicit}
          />
          Explicit content
        </label>
        <div className="flex items-center justify-end gap-3">
          {message && (
            <span className="text-muted-foreground text-xs" role="status">
              {message}
            </span>
          )}
          <Button disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
            Save
          </Button>
        </div>
      </form>
    </details>
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
    <label className="text-xs font-medium">
      {label}
      {children}
    </label>
  );
}

function splitIds(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
