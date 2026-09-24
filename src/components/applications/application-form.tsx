"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ApplicationType } from "@/types/firestore";

export function ApplicationForm({
  type,
  artist,
}: {
  type: ApplicationType;
  artist?: { id: string; name: string };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const socialUrls = splitUrls(form.get("socialUrls"));
    const payload =
      type === "artist_claim"
        ? {
            type,
            artistId: artist?.id,
            websiteUrl: form.get("websiteUrl"),
            socialUrls,
            contactEmail: form.get("contactEmail"),
            message: form.get("message"),
          }
        : type === "artist_creation"
          ? {
              type,
              name: form.get("name"),
              websiteUrl: form.get("websiteUrl"),
              socialUrls,
              biography: form.get("description"),
              categoryIds: [],
              message: form.get("message"),
            }
          : {
              type,
              name: form.get("name"),
              websiteUrl: form.get("websiteUrl"),
              socialUrls,
              representativeRole: form.get("representativeRole"),
              description: form.get("description"),
              message: form.get("message"),
            };

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        id?: string;
        message?: string;
      };
      if (!response.ok || !result.id) {
        throw new Error(result.message ?? "The application could not be sent.");
      }
      router.push(`/creator/applications/${result.id}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The application could not be sent.",
      );
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border-border bg-surface mt-8 max-w-2xl space-y-5 rounded-2xl border p-5 sm:p-7"
    >
      {type === "artist_claim" ? (
        <div className="bg-background/50 rounded-xl p-4">
          <p className="text-subtle text-[10px] font-semibold tracking-wide uppercase">
            Selected profile
          </p>
          <p className="mt-1 font-semibold">{artist?.name}</p>
        </div>
      ) : (
        <Field
          label={type === "artist_creation" ? "Artist name" : "Label name"}
        >
          <input
            className="manage-input mt-2"
            name="name"
            required
            minLength={2}
            maxLength={type === "artist_creation" ? 80 : 120}
          />
        </Field>
      )}

      <Field label="Official website" optional>
        <input
          className="manage-input mt-2"
          name="websiteUrl"
          type="url"
          placeholder="https://…"
        />
      </Field>
      <Field label="Social links" optional hint="One public profile per line.">
        <textarea
          className="manage-input mt-2 min-h-24 resize-y"
          name="socialUrls"
          placeholder={"https://instagram.com/…\nhttps://youtube.com/…"}
        />
      </Field>

      {type === "artist_claim" ? (
        <Field label="Professional contact email" optional>
          <input
            className="manage-input mt-2"
            name="contactEmail"
            type="email"
            placeholder="you@official-domain.com"
          />
        </Field>
      ) : null}

      {type === "label_creation" ? (
        <Field label="Your role at the label" optional>
          <input
            className="manage-input mt-2"
            name="representativeRole"
            maxLength={120}
            placeholder="Founder, manager, A&R…"
          />
        </Field>
      ) : null}

      {type !== "artist_claim" ? (
        <Field
          label={
            type === "artist_creation"
              ? "Tell us about your ASMR content"
              : "Tell us about the label"
          }
          optional
        >
          <textarea
            className="manage-input mt-2 min-h-32 resize-y"
            name="description"
            maxLength={4000}
          />
        </Field>
      ) : null}

      <Field
        label={
          type === "artist_claim"
            ? "Additional message"
            : "Anything else we should know?"
        }
        optional
      >
        <textarea
          className="manage-input mt-2 min-h-28 resize-y"
          name="message"
          maxLength={4000}
          placeholder={
            type === "artist_claim"
              ? "Tell us how we can verify this is your profile."
              : undefined
          }
        />
      </Field>

      {error ? (
        <p className="text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
        {pending
          ? "Sending…"
          : type === "artist_claim"
            ? "Submit claim"
            : "Submit application"}
      </Button>
    </form>
  );
}

function Field({
  label,
  optional = false,
  hint,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      <span>
        {label}
        {optional ? (
          <span className="text-subtle ml-2 text-xs font-normal">Optional</span>
        ) : (
          <span className="text-primary ml-1">*</span>
        )}
      </span>
      {children}
      {hint ? (
        <span className="text-subtle mt-1 block text-xs">{hint}</span>
      ) : null}
    </label>
  );
}

function splitUrls(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
