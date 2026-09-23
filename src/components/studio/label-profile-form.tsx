"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LabelProfileForm({
  labelId,
  initial,
}: {
  labelId: string;
  initial: {
    name: string;
    description: string;
    websiteUrl: string;
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
      const response = await fetch(`/api/studio/labels/${labelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          websiteUrl: form.get("websiteUrl"),
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Label profile could not be saved.");
      }
      setMessage("Label profile saved.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Label profile could not be saved.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border-border bg-surface mt-8 space-y-5 rounded-2xl border p-6"
    >
      <label className="block text-xs font-medium">
        Label name
        <input
          name="name"
          defaultValue={initial.name}
          required
          className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
        />
      </label>
      <label className="block text-xs font-medium">
        Website
        <input
          name="websiteUrl"
          type="url"
          defaultValue={initial.websiteUrl}
          className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
        />
      </label>
      <label className="block text-xs font-medium">
        Description
        <textarea
          name="description"
          defaultValue={initial.description}
          rows={7}
          className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
        />
      </label>
      {message && (
        <p className="text-muted-foreground text-xs" role="status">
          {message}
        </p>
      )}
      <Button disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
        Save profile
      </Button>
    </form>
  );
}
