import Link from "next/link";
import { ArrowRight, Building2, Disc3, FileCheck2 } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { Button } from "@/components/ui/button";
import { applicationSubject } from "@/lib/applications/display";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import {
  getApplicationRelatedRecords,
  listApplicationsForUser,
} from "@/lib/firebase/firestore/repositories/applications";
import { getStudioContexts } from "@/lib/studio/contexts";

export default async function CreatorPage() {
  const { user } = await requireActiveUser();
  const [contexts, applications] = await Promise.all([
    getStudioContexts(user.uid),
    listApplicationsForUser(user.uid, 5),
  ]);
  const related = await getApplicationRelatedRecords(applications);
  return (
    <div className="page-container mx-auto max-w-5xl pb-20">
      <header className="max-w-2xl">
        <p className="text-primary text-[11px] font-semibold tracking-[.18em] uppercase">
          Creator access
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
          Create on Nemufy
        </h1>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          Are you an artist or a label? Tell us what you need and Nemufy will
          review the request.
        </p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Link
          href="/creator/artist/claim"
          className="border-border bg-surface hover:border-primary/40 group rounded-3xl border p-6 transition-colors"
        >
          <span className="bg-primary/12 text-primary grid size-12 place-items-center rounded-2xl">
            <Disc3 className="size-5" />
          </span>
          <h2 className="mt-6 text-xl font-semibold">I&apos;m an artist</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Claim an existing artist profile or request a new one.
          </p>
          <span className="text-primary mt-6 inline-flex items-center gap-2 text-sm font-semibold">
            Continue <ArrowRight className="size-4" />
          </span>
        </Link>
        <Link
          href="/creator/label/apply"
          className="border-border bg-surface hover:border-primary/40 group rounded-3xl border p-6 transition-colors"
        >
          <span className="bg-primary/12 text-primary grid size-12 place-items-center rounded-2xl">
            <Building2 className="size-5" />
          </span>
          <h2 className="mt-6 text-xl font-semibold">I represent a label</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Apply to create a label and manage its artists after approval.
          </p>
          <span className="text-primary mt-6 inline-flex items-center gap-2 text-sm font-semibold">
            Continue <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>

      {contexts.length > 0 ? (
        <section className="border-border bg-surface mt-8 rounded-2xl border p-6">
          <h2 className="font-semibold">Your creator access</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {contexts.map((context) => (
              <Link
                key={`${context.type}:${context.id}`}
                href={`/manage/${context.type}s/${context.id}`}
                className="bg-background/60 hover:bg-surface-hover flex items-center justify-between rounded-xl p-4"
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {context.name}
                  </span>
                  <span className="text-subtle mt-1 block text-xs capitalize">
                    {context.type} · {context.role}
                  </span>
                </span>
                <ArrowRight className="text-primary size-4" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-border bg-surface mt-8 rounded-2xl border p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Applications</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Follow every review and reply when Nemufy needs more information.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/creator/applications">View all</Link>
          </Button>
        </div>
        {applications.length === 0 ? (
          <div className="text-muted-foreground mt-5 flex items-center gap-3 rounded-xl bg-white/3 p-4 text-sm">
            <FileCheck2 className="text-primary size-4" /> No applications yet.
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {applications.map((application) => (
              <Link
                key={application.id}
                href={`/creator/applications/${application.id}`}
                className="bg-background/55 hover:bg-surface-hover flex items-center gap-4 rounded-xl p-4"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {application.type === "artist_claim"
                      ? `Claim ${related.artists.get(application.artistId ?? "")?.displayName ?? related.artists.get(application.artistId ?? "")?.name ?? "artist profile"}`
                      : applicationSubject(application)}
                  </span>
                </span>
                <ApplicationStatusBadge status={application.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
