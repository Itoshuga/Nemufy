"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LabelArtistActions({
  labelId,
  artistId,
  action,
}: {
  labelId: string;
  artistId: string;
  action: "activate" | "end";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/studio/labels/${labelId}/artists/${artistId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Relationship update failed.");
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Relationship update failed.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <Button
        size="sm"
        variant={action === "end" ? "ghost" : "secondary"}
        disabled={pending}
        onClick={submit}
      >
        {action === "end" ? "Remove from label" : "Accept label"}
      </Button>
      {error && <p className="mt-1 text-[10px] text-rose-300">{error}</p>}
    </div>
  );
}
