"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Building2, Disc3, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateEntityForm({ type }: { type: "artist" | "label" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = type === "artist" ? Disc3 : Building2;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/studio/${type}s`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          ...(type === "artist"
            ? { biography: form.get("description") }
            : { description: form.get("description") }),
        }),
      });
      const payload = (await response.json()) as {
        id?: string;
        message?: string;
      };
      if (!response.ok || !payload.id)
        throw new Error(payload.message ?? "Creation failed.");
      router.push(`/manage/${type}s/${payload.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Creation failed.");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border-border bg-surface rounded-2xl border p-5"
    >
      <Icon className="text-primary size-5" />
      <h2 className="mt-4 text-base font-semibold">
        Create {type === "artist" ? "an artist" : "a label"}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Start with the identity. Team and catalog access stay separate.
      </p>
      <label className="mt-5 block text-xs font-medium">
        Name
        <input
          name="name"
          required
          minLength={2}
          maxLength={120}
          className="border-border bg-background focus:border-primary mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
        />
      </label>
      <label className="mt-4 block text-xs font-medium">
        Short description
        <textarea
          name="description"
          rows={3}
          maxLength={4000}
          className="border-border bg-background focus:border-primary mt-2 w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none"
        />
      </label>
      {error && (
        <p className="mt-3 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
      <Button className="mt-5 w-full" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" />}
        Create {type}
      </Button>
    </form>
  );
}
