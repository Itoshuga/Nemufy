"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LabelArtistForm({
  labelId,
  artistOptions = [],
}: {
  labelId: string;
  artistOptions?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const body =
      mode === "new"
        ? {
            flow: "new",
            name: form.get("name"),
            description: form.get("description"),
          }
        : { flow: "existing", artistId: form.get("artistId") };
    try {
      const response = await fetch(`/api/studio/labels/${labelId}/artists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        id?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(payload.message ?? "Artist operation failed.");
      setMessage(
        mode === "new"
          ? "Artist created and linked to this label."
          : "A pending artist link was created.",
      );
      event.currentTarget.reset();
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "Artist operation failed.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="border-border bg-surface rounded-2xl border p-5"
    >
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "new" ? "default" : "secondary"}
          onClick={() => setMode("new")}
        >
          <Plus />
          New artist
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "existing" ? "default" : "secondary"}
          onClick={() => setMode("existing")}
        >
          <Search />
          Existing artist
        </Button>
      </div>
      {mode === "new" ? (
        <div className="mt-5 grid gap-4">
          <label className="text-xs font-medium">
            Artist name
            <input
              name="name"
              required
              className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-xs font-medium">
            Biography
            <textarea
              name="description"
              rows={3}
              className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </label>
        </div>
      ) : (
        <label className="mt-5 block text-xs font-medium">
          Artist
          <select
            name="artistId"
            required
            className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Search or choose an artist…
            </option>
            {artistOptions.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground mt-2 block">
            This creates a pending relationship; it does not silently take
            control.
          </span>
        </label>
      )}
      <Button className="mt-5" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" />}
        {mode === "new" ? "Create artist" : "Request link"}
      </Button>
      {message && (
        <p className="text-muted-foreground mt-3 text-xs" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
