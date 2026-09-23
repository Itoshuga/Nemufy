"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  "Release type",
  "Information",
  "Artists",
  "Tracks",
  "Artwork",
  "Metadata",
  "Review",
];

export function ReleaseForm({
  artistId,
  artistName,
}: {
  artistId: string;
  artistName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<"single" | "ep" | "album">("single");
  const [draft, setDraft] = useState({
    title: "",
    releaseDate: new Date().toISOString().slice(0, 10),
    description: "",
    featuredArtistIds: "",
    copyright: "",
    explicit: false,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/studio/artists/${artistId}/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          type,
          releaseDate: draft.releaseDate,
          description: draft.description,
          copyright: draft.copyright,
          explicit: draft.explicit,
          primaryArtistIds: [artistId],
          featuredArtistIds: draft.featuredArtistIds
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      const payload = (await response.json()) as {
        id?: string;
        message?: string;
      };
      if (!response.ok || !payload.id)
        throw new Error(payload.message ?? "Draft creation failed.");
      router.push(`/studio/artists/${artistId}/releases/${payload.id}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Draft creation failed.",
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {steps.map((label, index) => (
          <li
            key={label}
            className={cn(
              "rounded-xl border px-3 py-2 text-[11px]",
              index === step
                ? "border-primary/50 bg-primary/10 text-primary"
                : index < step
                  ? "border-emerald-400/20 text-emerald-300"
                  : "border-border text-subtle",
            )}
          >
            <span className="mr-2">
              {index < step ? <Check className="inline size-3" /> : index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <div className="border-border bg-surface mt-5 min-h-80 rounded-2xl border p-6">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold">What are you releasing?</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {(["single", "ep", "album"] as const).map((candidate) => (
                <button
                  type="button"
                  key={candidate}
                  onClick={() => setType(candidate)}
                  className={cn(
                    "rounded-2xl border p-6 text-left capitalize",
                    type === candidate
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background",
                  )}
                >
                  {candidate}
                  <span className="text-muted-foreground mt-2 block text-xs">
                    {candidate === "single"
                      ? "Usually one track"
                      : "Multiple ordered tracks"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="text-xs font-medium">
              Title
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                required
                className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
            <label className="text-xs font-medium">
              Release date
              <input
                value={draft.releaseDate}
                onChange={(event) =>
                  setDraft({ ...draft, releaseDate: event.target.value })
                }
                type="date"
                required
                className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
            <label className="text-xs font-medium lg:col-span-2">
              Description
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                rows={5}
                className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold">Release artists</h2>
            <div className="border-border bg-background mt-5 rounded-xl border p-4">
              <p className="text-subtle text-[10px] uppercase">
                Primary artist
              </p>
              <p className="mt-1 font-medium">{artistName}</p>
            </div>
            <label className="mt-5 block text-xs font-medium">
              Featured artist IDs{" "}
              <span className="text-subtle">(comma separated)</span>
              <input
                value={draft.featuredArtistIds}
                onChange={(event) =>
                  setDraft({ ...draft, featuredArtistIds: event.target.value })
                }
                className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
            <p className="text-muted-foreground mt-3 text-xs">
              Featuring credits stay structured and are never embedded in the
              title.
            </p>
          </div>
        )}
        {step === 3 && (
          <StageNote
            title="Tracks are added after the draft exists"
            description="The next screen uploads audio with progress, then stores the track metadata and its releaseId together."
          />
        )}
        {step === 4 && (
          <StageNote
            title="Artwork follows the draft"
            description="Upload a square JPEG, PNG or WEBP. Nemufy keeps both its Storage path and download URL."
          />
        )}
        {step === 5 && (
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="text-xs font-medium">
              Copyright
              <input
                value={draft.copyright}
                onChange={(event) =>
                  setDraft({ ...draft, copyright: event.target.value })
                }
                placeholder="© 2026 Artist"
                className="border-border bg-background mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
            <label className="border-border bg-background flex items-center gap-3 self-end rounded-xl border px-4 py-3 text-sm">
              <input
                checked={draft.explicit}
                onChange={(event) =>
                  setDraft({ ...draft, explicit: event.target.checked })
                }
                type="checkbox"
              />{" "}
              Explicit content
            </label>
          </div>
        )}
        {step === 6 && (
          <StageNote
            title="Create a private draft"
            description={`${type.toUpperCase()} by ${artistName}. Nothing is published automatically. Publication will run a fresh server-side validation.`}
          />
        )}
      </div>
      {error && (
        <p className="mt-4 text-sm text-rose-300" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-between">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 0 || pending}
          onClick={() => setStep((current) => current - 1)}
        >
          <ArrowLeft />
          Back
        </Button>
        <Button
          type={step === steps.length - 1 ? "submit" : "button"}
          onClick={
            step === steps.length - 1
              ? undefined
              : () => setStep((current) => current + 1)
          }
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" />
          ) : step === steps.length - 1 ? (
            <Check />
          ) : (
            <ArrowRight />
          )}
          {step === steps.length - 1 ? "Create draft" : "Continue"}
        </Button>
      </div>
    </form>
  );
}

function StageNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-6">
        {description}
      </p>
    </div>
  );
}
