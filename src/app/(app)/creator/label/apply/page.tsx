import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApplicationForm } from "@/components/applications/application-form";
import { listLabels } from "@/lib/firebase/firestore/repositories/labels";

export default async function LabelApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const labels = q
    ? (await listLabels(100)).filter((label) =>
        label.name.toLowerCase().includes(q.trim().toLowerCase()),
      )
    : [];
  return (
    <div className="page-container mx-auto max-w-4xl pb-20">
      <Link
        href="/creator"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" /> Creator access
      </Link>
      <header className="mt-7 max-w-2xl">
        <p className="text-primary text-[11px] font-semibold tracking-[.18em] uppercase">
          Label
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-.045em]">
          Create a label on Nemufy
        </h1>
        <p className="text-muted-foreground mt-3 leading-7">
          Check whether the label already exists, then submit a short
          application.
        </p>
      </header>
      <form className="mt-7 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          className="manage-input"
          placeholder="Search existing labels…"
        />
        <button className="bg-surface border-border rounded-full border px-5 text-sm font-semibold">
          Search
        </button>
      </form>
      {q && labels.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-400/6 p-5">
          <p className="font-semibold text-amber-100">
            This label may already exist.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-100/80">
            {labels.slice(0, 6).map((label) => (
              <li key={label.id}>{label.name}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-amber-100/70">
            Contact its owner or Nemufy support for access instead of creating a
            duplicate.
          </p>
        </div>
      ) : null}
      <ApplicationForm type="label_creation" />
    </div>
  );
}
