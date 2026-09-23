"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, LoaderCircle, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReleaseModerationActions({
  releaseId,
  status,
}: {
  releaseId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "publish" | "unpublish" | "archive") {
    setPending(action);
    setError(null);
    try {
      const response = await fetch(`/api/admin/releases/${releaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Release moderation failed.");
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Release moderation failed.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status !== "published" && status !== "scheduled" && (
          <Button disabled={pending !== null} onClick={() => act("publish")}>
            {pending === "publish" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Send />
            )}
            Publish
          </Button>
        )}
        {(status === "published" || status === "scheduled") && (
          <Button
            variant="secondary"
            disabled={pending !== null}
            onClick={() => act("unpublish")}
          >
            {pending === "unpublish" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <RotateCcw />
            )}
            Unpublish
          </Button>
        )}
        {status !== "archived" && (
          <Button
            variant="secondary"
            disabled={pending !== null}
            onClick={() => act("archive")}
          >
            {pending === "archive" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Archive />
            )}
            Archive
          </Button>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
