"use client";

import { Check, LoaderCircle, MessageSquare, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus, ApplicationType } from "@/types/firestore";

export function AdminApplicationActions({
  applicationId,
  type,
  status,
  approveDescription,
  artistOptions = [],
}: {
  applicationId: string;
  type: ApplicationType;
  status: ApplicationStatus;
  approveDescription: string;
  artistOptions?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = ["pending", "under_review", "needs_information"].includes(
    status,
  );

  async function mutate(action: string, body: object = {}) {
    setPending(action);
    setError(null);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
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

  function requestInformation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void mutate("request_information", { message: form.get("message") });
  }

  function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void mutate("reject", {
      reason: form.get("reason"),
      message: form.get("message"),
      adminNote: form.get("adminNote"),
    });
  }

  function linkExisting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void mutate("link_existing", { artistId: form.get("artistId") });
  }

  if (!active) return null;

  return (
    <section className="border-border bg-surface mt-6 rounded-2xl border p-5">
      <div className="flex flex-wrap items-center gap-3">
        {status === "pending" ? (
          <Button
            variant="secondary"
            disabled={pending !== null}
            onClick={() => void mutate("start_review")}
          >
            {pending === "start_review" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Search />
            )}
            Start review
          </Button>
        ) : null}
        <details className="relative">
          <summary className="border-border bg-surface hover:bg-surface-hover inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border px-5 text-sm font-semibold">
            <X className="size-4" /> Reject
          </summary>
          <form
            onSubmit={reject}
            className="border-border bg-surface absolute top-12 left-0 z-30 w-[min(90vw,390px)] space-y-3 rounded-2xl border p-4 shadow-2xl"
          >
            <select name="reason" required className="manage-input">
              <option value="">Reason…</option>
              <option value="unable_to_verify_ownership">
                Unable to verify ownership
              </option>
              <option value="duplicate_artist_profile">
                Duplicate artist profile
              </option>
              <option value="insufficient_information">
                Insufficient information
              </option>
              <option value="invalid_label_request">
                Invalid label request
              </option>
              <option value="other">Other</option>
            </select>
            <textarea
              name="message"
              required
              minLength={2}
              maxLength={4000}
              className="manage-input min-h-28 resize-y"
              placeholder="Message shown to the applicant"
            />
            <textarea
              name="adminNote"
              maxLength={4000}
              className="manage-input min-h-20 resize-y"
              placeholder="Internal note (optional)"
            />
            <Button variant="destructive" disabled={pending !== null}>
              {pending === "reject" && (
                <LoaderCircle className="animate-spin" />
              )}
              Reject application
            </Button>
          </form>
        </details>
        <details className="relative">
          <summary className="border-border bg-surface hover:bg-surface-hover inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border px-5 text-sm font-semibold">
            <MessageSquare className="size-4" /> Request information
          </summary>
          <form
            onSubmit={requestInformation}
            className="border-border bg-surface absolute top-12 left-0 z-30 w-[min(90vw,390px)] space-y-3 rounded-2xl border p-4 shadow-2xl"
          >
            <p className="text-sm font-semibold">What do you need?</p>
            <textarea
              name="message"
              required
              minLength={2}
              maxLength={4000}
              className="manage-input min-h-32 resize-y"
              placeholder="Please provide a link from your official social account…"
            />
            <Button disabled={pending !== null}>
              {pending === "request_information" && (
                <LoaderCircle className="animate-spin" />
              )}
              Send request
            </Button>
          </form>
        </details>
        <Button
          disabled={pending !== null}
          onClick={() => {
            if (
              window.confirm(`Approve application?\n\n${approveDescription}`)
            ) {
              void mutate("approve");
            }
          }}
        >
          {pending === "approve" ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Check />
          )}
          Approve
        </Button>
      </div>

      {type === "artist_creation" && artistOptions.length > 0 ? (
        <details className="mt-5">
          <summary className="text-primary cursor-pointer text-sm font-semibold">
            Link to an existing artist instead
          </summary>
          <form onSubmit={linkExisting} className="mt-3 flex flex-wrap gap-2">
            <select name="artistId" required className="manage-filter min-w-64">
              <option value="">Select artist…</option>
              {artistOptions.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" disabled={pending !== null}>
              {pending === "link_existing" && (
                <LoaderCircle className="animate-spin" />
              )}
              Convert to claim
            </Button>
          </form>
        </details>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
