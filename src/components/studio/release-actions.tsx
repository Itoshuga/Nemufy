"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, Copy, LoaderCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReleaseActions({
  artistId,
  releaseId,
  canPublish,
  canEdit,
  canCreate,
  canDelete,
  status,
}: {
  artistId: string;
  releaseId: string;
  canPublish: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function act(action: "publish" | "archive" | "duplicate" | "discard") {
    setPending(action);
    setError(null);
    try {
      const response = await fetch(
        `/api/studio/artists/${artistId}/releases/${releaseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const payload = (await response.json()) as {
        id?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(payload.message ?? "Release update failed.");
      if (action === "duplicate" && payload.id) {
        router.push(`/studio/artists/${artistId}/releases/${payload.id}`);
      } else if (action === "discard") {
        router.push(`/studio/artists/${artistId}/releases`);
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Release update failed.",
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canPublish && status !== "published" && (
          <Button onClick={() => act("publish")} disabled={pending !== null}>
            {pending === "publish" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Send />
            )}
            Publish
          </Button>
        )}
        {canEdit && status !== "archived" && (
          <Button
            variant="secondary"
            onClick={() => act("archive")}
            disabled={pending !== null}
          >
            {pending === "archive" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Archive />
            )}
            Archive
          </Button>
        )}
        {canCreate && (
          <Button
            variant="secondary"
            onClick={() => act("duplicate")}
            disabled={pending !== null}
          >
            {pending === "duplicate" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Copy />
            )}
            Duplicate
          </Button>
        )}
        {canDelete && status === "draft" && (
          <Button
            variant="destructive"
            onClick={() => {
              if (
                window.confirm("Discard this draft and archive its tracks?")
              ) {
                void act("discard");
              }
            }}
            disabled={pending !== null}
          >
            {pending === "discard" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Trash2 />
            )}
            Discard draft
          </Button>
        )}
      </div>
      {error && (
        <p className="mt-2 max-w-md text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
