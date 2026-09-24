import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import {
  applicationSubject,
  applicationTypeLabels,
} from "@/lib/applications/display";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import {
  getApplicationRelatedRecords,
  listApplicationsForUser,
} from "@/lib/firebase/firestore/repositories/applications";

export default async function CreatorApplicationsPage() {
  const { user } = await requireActiveUser();
  const applications = await listApplicationsForUser(user.uid);
  const related = await getApplicationRelatedRecords(applications);
  return (
    <div className="page-container mx-auto max-w-4xl pb-20">
      <Link
        href="/creator"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" /> Creator access
      </Link>
      <header className="mt-7">
        <p className="text-primary text-[11px] font-semibold tracking-[.18em] uppercase">
          Creator access
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-.045em]">
          Your applications
        </h1>
      </header>
      <div className="mt-8 space-y-3">
        {applications.map((application) => {
          const artist = application.artistId
            ? related.artists.get(application.artistId)
            : null;
          return (
            <Link
              key={application.id}
              href={`/creator/applications/${application.id}`}
              className="border-border bg-surface hover:border-primary/35 flex items-center gap-4 rounded-2xl border p-5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {application.type === "artist_claim"
                    ? `Claim ${artist?.displayName ?? artist?.name ?? "artist profile"}`
                    : applicationSubject(application)}
                </span>
                <span className="text-subtle mt-1 block text-xs">
                  {applicationTypeLabels[application.type]} · Submitted{" "}
                  {application.createdAt.toDate().toLocaleDateString()}
                </span>
              </span>
              <ApplicationStatusBadge status={application.status} />
              <ArrowRight className="text-subtle size-4" />
            </Link>
          );
        })}
        {applications.length === 0 ? (
          <div className="border-border bg-surface rounded-2xl border p-8 text-center">
            <p className="font-semibold">No applications yet</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Start from Creator access when you are ready.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
