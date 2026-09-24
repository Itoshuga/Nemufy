"use client";

import { LoaderCircle, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus } from "@/types/firestore";

export function ApplicantApplicationActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"respond" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mutate(body: object, action: "respond" | "cancel") {
    setPending(action);
    setError(null);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(
          result.message ?? "The application could not be updated.",
        );
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The application could not be updated.",
      );
    } finally {
      setPending(null);
    }
  }

  function respond(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void mutate({ action: "respond", message: form.get("message") }, "respond");
  }

  const active = ["pending", "under_review", "needs_information"].includes(
    status,
  );
  if (!active) return null;

  return (
    <div className="mt-6 space-y-4">
      {status === "needs_information" ? (
        <form
          onSubmit={respond}
          className="border-border bg-surface rounded-2xl border p-5"
        >
          <h2 className="font-semibold">Your response</h2>
          <textarea
            name="message"
            required
            minLength={2}
            maxLength={4000}
            className="manage-input mt-3 min-h-32 resize-y"
            placeholder="Add the requested links or information…"
          />
          <Button className="mt-4" disabled={pending !== null}>
            {pending === "respond" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Send />
            )}
            Send information
          </Button>
        </form>
      ) : null}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={pending !== null}
          onClick={() => {
            if (window.confirm("Cancel this application?")) {
              void mutate({ action: "cancel" }, "cancel");
            }
          }}
        >
          {pending === "cancel" ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <X />
          )}
          Cancel application
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
