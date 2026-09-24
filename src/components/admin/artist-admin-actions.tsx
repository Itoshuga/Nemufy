"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  BadgeCheck,
  LoaderCircle,
  MoreHorizontal,
  ShieldOff,
} from "lucide-react";

export function ArtistAdminActions({
  artistId,
  verified,
  status,
}: {
  artistId: string;
  verified: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(action: string, input: object) {
    setPending(action);
    setError(null);
    try {
      const response = await fetch(`/api/admin/artists/${artistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Artist update failed.");
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Artist update failed.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="relative">
      <details className="user-menu relative">
        <summary
          className="border-border hover:bg-surface-hover grid size-8 cursor-pointer list-none place-items-center rounded-full border"
          aria-label="Artist administration actions"
        >
          <MoreHorizontal className="size-3.5" />
        </summary>
        <div className="border-border bg-surface absolute top-10 right-0 z-30 w-48 space-y-1 rounded-xl border p-2 shadow-2xl">
          <Action
            icon={BadgeCheck}
            label={verified ? "Remove verification" : "Verify artist"}
            pending={pending === "verify"}
            onClick={() => update("verify", { verified: !verified })}
          />
          <Action
            icon={ShieldOff}
            label={status === "suspended" ? "Reactivate" : "Suspend"}
            pending={pending === "status"}
            destructive={status !== "suspended"}
            onClick={() => {
              if (
                status === "suspended" ||
                window.confirm("Suspend this artist workspace?")
              ) {
                void update("status", {
                  status: status === "suspended" ? "active" : "suspended",
                });
              }
            }}
          />
          {status !== "archived" ? (
            <Action
              icon={Archive}
              label="Archive"
              pending={pending === "archive"}
              onClick={() => {
                if (window.confirm("Archive this artist?")) {
                  void update("archive", { status: "archived" });
                }
              }}
            />
          ) : null}
        </div>
      </details>
      {error ? <p className="mt-1 text-[10px] text-rose-300">{error}</p> : null}
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  pending,
  destructive = false,
  onClick,
}: {
  icon: typeof Archive;
  label: string;
  pending: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${
        destructive
          ? "text-rose-300 hover:bg-rose-400/8"
          : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
      }`}
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
