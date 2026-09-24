"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  Copy,
  LoaderCircle,
  MoreHorizontal,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReleaseActions({
  artistId,
  releaseId,
  canPublish,
  canEdit,
  canCreate,
  canDelete,
  isAdmin = false,
  status,
}: {
  artistId: string;
  releaseId: string;
  canPublish: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  isAdmin?: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function act(
    action: "publish" | "unpublish" | "archive" | "duplicate" | "discard",
  ) {
    setPending(action);
    setError(null);
    try {
      const response = await fetch(
        action === "unpublish"
          ? `/api/admin/releases/${releaseId}`
          : `/api/studio/artists/${artistId}/releases/${releaseId}`,
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
        router.push(`/manage/releases/${payload.id}`);
      } else if (action === "discard") {
        router.push(`/manage/artists/${artistId}/music`);
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
    <div className="relative">
      <div className="flex items-center gap-2">
        {canPublish && status !== "published" && (
          <Button
            onClick={() => {
              if (
                window.confirm(
                  "Publish this release now? Nemufy will validate the cover, tracks and release date.",
                )
              )
                void act("publish");
            }}
            disabled={pending !== null}
          >
            {pending === "publish" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Send />
            )}
            Publish
          </Button>
        )}
        {(canEdit || canCreate || canDelete) && (
          <details className="user-menu relative">
            <summary
              className="border-border bg-surface hover:bg-surface-hover grid size-10 cursor-pointer list-none place-items-center rounded-full border"
              aria-label="Release actions"
            >
              <MoreHorizontal className="size-4" />
            </summary>
            <div className="border-border bg-surface absolute top-12 right-0 z-30 w-52 space-y-1 rounded-xl border p-2 shadow-2xl">
              {canCreate ? (
                <MenuAction
                  icon={Copy}
                  label="Duplicate"
                  pending={pending === "duplicate"}
                  onClick={() => act("duplicate")}
                />
              ) : null}
              {isAdmin && (status === "published" || status === "scheduled") ? (
                <MenuAction
                  icon={Archive}
                  label="Unpublish"
                  pending={pending === "unpublish"}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Unpublish this release and return its tracks to draft?",
                      )
                    ) {
                      void act("unpublish");
                    }
                  }}
                />
              ) : null}
              {canEdit && status !== "archived" ? (
                <MenuAction
                  icon={Archive}
                  label="Archive"
                  pending={pending === "archive"}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Archive this release? It will no longer be active in the catalog.",
                      )
                    )
                      void act("archive");
                  }}
                />
              ) : null}
              {canDelete && status === "draft" ? (
                <MenuAction
                  icon={Trash2}
                  label="Delete draft"
                  destructive
                  pending={pending === "discard"}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this draft? Its tracks will be archived.",
                      )
                    )
                      void act("discard");
                  }}
                />
              ) : null}
            </div>
          </details>
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

function MenuAction({
  icon: Icon,
  label,
  onClick,
  pending,
  destructive = false,
}: {
  icon: typeof Archive;
  label: string;
  onClick: () => void;
  pending: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${destructive ? "text-rose-300 hover:bg-rose-400/8" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}
    >
      {pending ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : (
        <Icon className="size-3.5" />
      )}
      {label}
    </button>
  );
}
