"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ChevronDown, Disc3, LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ArtistOption = { id: string; name: string };

export function ReleaseForm({
  artists,
  artistId,
  artistName,
}: {
  artists?: ArtistOption[];
  artistId?: string;
  artistName?: string;
}) {
  const options =
    artists ??
    (artistId && artistName ? [{ id: artistId, name: artistName }] : []);
  const router = useRouter();
  const [selectedArtistId, setSelectedArtistId] = useState(
    options[0]?.id ?? "",
  );
  const [type, setType] = useState<"single" | "ep" | "album">("single");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedArtistId) {
      setError("Choose an artist for this release.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/studio/artists/${selectedArtistId}/releases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.get("title"),
            type,
            releaseDate: form.get("releaseDate"),
            description: form.get("description"),
            copyright: form.get("copyright"),
            explicit: form.get("explicit") === "on",
            primaryArtistIds: [selectedArtistId],
            featuredArtistIds: form.getAll("featuredArtistIds"),
          }),
        },
      );
      const payload = (await response.json()) as {
        id?: string;
        message?: string;
      };
      if (!response.ok || !payload.id) {
        throw new Error(
          payload.message ?? "The release draft could not be created.",
        );
      }
      router.push(`/manage/releases/${payload.id}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The release draft could not be created.",
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-4xl space-y-6">
      <section className="border-border bg-surface rounded-2xl border p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-xl">
            <Disc3 className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">Release details</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Only the information needed to create a private draft.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <input
              name="title"
              required
              autoFocus
              className="manage-input"
              placeholder="Midnight Dreams"
            />
          </Field>

          <div className="sm:col-span-2">
            <span className="mb-2 block text-xs font-medium">Type</span>
            <div className="grid grid-cols-3 gap-2">
              {(["single", "ep", "album"] as const).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setType(candidate)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-sm font-medium capitalize transition-colors",
                    type === candidate
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {candidate}
                </button>
              ))}
            </div>
          </div>

          <Field label="Primary artist">
            <select
              value={selectedArtistId}
              onChange={(event) => setSelectedArtistId(event.target.value)}
              className="manage-input"
              required
            >
              <option value="">Select artist</option>
              {options.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Release date">
            <input
              name="releaseDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="manage-input"
            />
          </Field>

          <Field label="Copyright" className="sm:col-span-2">
            <input
              name="copyright"
              className="manage-input"
              placeholder="© 2026 Artist"
            />
          </Field>
        </div>
      </section>

      <details className="border-border bg-surface rounded-2xl border p-5 sm:p-6">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
          Advanced
          <ChevronDown className="text-muted-foreground size-4" />
        </summary>
        <div className="mt-5 grid gap-5">
          <Field label="Description">
            <textarea
              name="description"
              rows={4}
              className="manage-input min-h-28 py-3"
            />
          </Field>
          {options.length > 1 ? (
            <fieldset>
              <legend className="mb-2 text-xs font-medium">Featuring</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {options
                  .filter((artist) => artist.id !== selectedArtistId)
                  .map((artist) => (
                    <label
                      key={artist.id}
                      className="border-border bg-background flex items-center gap-3 rounded-xl border p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="featuredArtistIds"
                        value={artist.id}
                      />
                      {artist.name}
                    </label>
                  ))}
              </div>
            </fieldset>
          ) : null}
          <label className="flex items-center gap-3 text-sm">
            <input name="explicit" type="checkbox" /> Explicit content
          </label>
        </div>
      </details>

      <div className="border-primary/15 bg-primary/5 rounded-2xl border p-4 text-sm">
        <p className="font-medium">Next: cover and tracks</p>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          After creating the draft, you&apos;ll add artwork, upload audio and
          review everything before publishing.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button size="lg" disabled={pending || !selectedArtistId}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Plus />}
          {pending ? "Creating draft…" : "Create draft"}
        </Button>
      </div>
    </form>
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
