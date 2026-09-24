"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MemberActions({
  type,
  targetId,
  membershipId,
  role,
}: {
  type: "artist" | "label";
  targetId: string;
  membershipId: string;
  role: string;
}) {
  const router = useRouter();
  const [nextRole, setNextRole] = useState(role);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function update(body: object) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/studio/${type}s/${targetId}/memberships/${membershipId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(payload.message ?? "Membership update failed.");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Membership update failed.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <div className="flex items-center gap-2">
        <select
          value={nextRole}
          onChange={(event) => setNextRole(event.target.value)}
          className="border-border bg-background rounded-lg border px-2 py-1.5 text-xs"
        >
          <option value="owner">Owner</option>
          {type === "label" && <option value="admin">Admin</option>}
          <option value="manager">Manager</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending || nextRole === role}
          onClick={() => update({ action: "role", role: nextRole })}
        >
          Change
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => update({ action: "revoke" })}
        >
          Remove
        </Button>
      </div>
      {error && (
        <p className="mt-1 max-w-56 text-[10px] text-rose-300">{error}</p>
      )}
    </div>
  );
}
