"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ChevronDown, Check, LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReleaseMetadataForm({
  artistId,
  releaseId,
  artistName,
  artistOptions = [],
  readOnly = false,
  initial,
}: {
  artistId: string;
  releaseId: string;
  artistName?: string;
  artistOptions?: Array<{ id: string; name: string }>;
  readOnly?: boolean;
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
    const form = new FormData(event.currentTarget);
    setPending(true);
    setMessage(null);
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
              primaryArtistIds: initial.primaryArtistIds,
              featuredArtistIds: form.getAll("featuredArtistIds"),
            },
          }),
        },
      );
      const payload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(
          payload.message ?? "Release details could not be saved.",
        );
      setMessage("Saved");
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Release details could not be saved.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-border bg-surface rounded-2xl border p-5 sm:p-6">
      <div>
        <h2 className="font-semibold">Release details</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Listener-facing metadata. The primary artist is controlled by this
          workspace.
        </p>
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <input
            name="title"
            defaultValue={initial.title}
            required
            disabled={readOnly}
            className="manage-input"
          />
        </Field>
        <Field label="Type">
          <select
            name="type"
            defaultValue={initial.type}
            disabled={readOnly}
            className="manage-input"
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
            disabled={readOnly}
            className="manage-input"
          />
        </Field>
        <Field label="Primary artist">
          <input
            value={artistName ?? "Artist"}
            disabled
            className="manage-input"
            aria-label="Primary artist"
          />
        </Field>
        <Field label="Copyright">
          <input
            name="copyright"
            defaultValue={initial.copyright}
            disabled={readOnly}
            className="manage-input"
          />
        </Field>

        <details className="border-border rounded-xl border p-4 sm:col-span-2">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
            Advanced <ChevronDown className="text-muted-foreground size-4" />
          </summary>
          <div className="mt-4 space-y-4">
            <Field label="Description">
              <textarea
                name="description"
                defaultValue={initial.description}
                rows={4}
                disabled={readOnly}
                className="manage-input min-h-28 py-3"
              />
            </Field>
            {artistOptions.length > 1 ? (
              <fieldset disabled={readOnly}>
                <legend className="mb-2 text-xs font-medium">Featuring</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {artistOptions
                    .filter(
                      (artist) => !initial.primaryArtistIds.includes(artist.id),
                    )
                    .map((artist) => (
                      <label
                        key={artist.id}
                        className="border-border bg-background flex items-center gap-3 rounded-xl border p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="featuredArtistIds"
                          value={artist.id}
                          defaultChecked={initial.featuredArtistIds.includes(
                            artist.id,
                          )}
                        />
                        {artist.name}
                      </label>
                    ))}
                </div>
              </fieldset>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                name="explicit"
                type="checkbox"
                defaultChecked={initial.explicit}
                disabled={readOnly}
              />{" "}
              Explicit content
            </label>
          </div>
        </details>

        {!readOnly ? (
          <div className="flex items-center justify-end gap-3 sm:col-span-2">
            {message ? (
              <span
                className="text-muted-foreground flex items-center gap-1 text-xs"
                role="status"
              >
                {message === "Saved" ? (
                  <Check className="size-3 text-emerald-300" />
                ) : null}
                {message}
              </span>
            ) : null}
            <Button disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
              {pending ? "Saving…" : "Save details"}
            </Button>
          </div>
        ) : null}
      </form>
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
