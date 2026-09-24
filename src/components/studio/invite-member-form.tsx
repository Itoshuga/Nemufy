"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InviteMemberForm({
  type,
  targetId,
}: {
  type: "artist" | "label";
  targetId: string;
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
      const response = await fetch(
        `/api/studio/${type}s/${targetId}/invitations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.get("email"),
            role: form.get("role"),
          }),
        },
      );
      const payload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(payload.message ?? "Invitation failed.");
      event.currentTarget.reset();
      setMessage("Invitation prepared. Email delivery can be connected later.");
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "Invitation failed.",
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
      <div className="flex items-center gap-3">
        <MailPlus className="text-primary size-5" />
        <div>
          <p className="font-semibold">Invite a team member</p>
          <p className="text-muted-foreground text-xs">
            Creates a seven-day pending invitation.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
        <input
          name="email"
          type="email"
          required
          placeholder="member@example.com"
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        />
        <select
          name="role"
          className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="manager">Manager</option>
          {type === "label" && <option value="admin">Admin</option>}
          <option value="owner">Owner</option>
        </select>
        <Button disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />}Invite
        </Button>
      </div>
      {message && (
        <p className="text-muted-foreground mt-3 text-xs" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
