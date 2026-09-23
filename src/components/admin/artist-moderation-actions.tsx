"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ArtistModerationActions({
  artistId,
  verified,
  status,
}: {
  artistId: string;
  verified: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function patch(input: object) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/artists/${artistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(payload.message ?? "Moderation update failed.");
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "Moderation update failed.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => patch({ verified: !verified })}
          disabled={pending}
          variant="secondary"
        >
          {verified ? "Remove verification" : "Verify artist"}
        </Button>
        <Button
          onClick={() =>
            patch({ status: status === "suspended" ? "active" : "suspended" })
          }
          disabled={pending}
          variant={status === "suspended" ? "secondary" : "destructive"}
        >
          {status === "suspended" ? "Reactivate" : "Suspend"}
        </Button>
        <Button
          onClick={() => patch({ status: "archived" })}
          disabled={pending}
          variant="secondary"
        >
          Archive
        </Button>
      </div>
      {message && <p className="mt-2 text-xs text-rose-300">{message}</p>}
    </div>
  );
}
