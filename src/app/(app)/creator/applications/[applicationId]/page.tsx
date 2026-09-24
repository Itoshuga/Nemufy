import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { ApplicantApplicationActions } from "@/components/applications/applicant-application-actions";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import {
  applicationSubject,
  applicationTypeLabels,
} from "@/lib/applications/display";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import {
  getApplicationById,
  getApplicationRelatedRecords,
  listApplicationMessages,
} from "@/lib/firebase/firestore/repositories/applications";

export default async function CreatorApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const { user } = await requireActiveUser();
  const application = await getApplicationById(applicationId);
  if (!application || application.applicantUserId !== user.uid) notFound();
  const [messages, related] = await Promise.all([
    listApplicationMessages(applicationId),
    getApplicationRelatedRecords([application]),
  ]);
  const artist = application.artistId
    ? related.artists.get(application.artistId)
    : null;
  const title =
    application.type === "artist_claim"
      ? `Claim ${artist?.displayName ?? artist?.name ?? "artist profile"}`
      : applicationSubject(application);
  return (
    <div className="page-container mx-auto max-w-3xl pb-20">
      <Link
        href="/creator/applications"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" /> Your applications
      </Link>
      <header className="mt-7">
        <p className="text-primary text-[11px] font-semibold tracking-[.18em] uppercase">
          {applicationTypeLabels[application.type]}
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-.045em]">
          {title}
        </h1>
      </header>

      <section className="border-border bg-surface mt-8 grid gap-5 rounded-2xl border p-6 sm:grid-cols-2">
        <Detail
          label="Submitted"
          value={application.createdAt.toDate().toLocaleDateString()}
        />
        <div>
          <p className="text-subtle text-xs uppercase">Status</p>
          <div className="mt-2">
            <ApplicationStatusBadge status={application.status} />
          </div>
        </div>
      </section>

      {application.messageToApplicant ? (
        <section className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/8 p-5">
          <p className="font-semibold text-amber-100">
            {application.status === "needs_information"
              ? "Nemufy needs more information"
              : application.status === "rejected"
                ? "Application rejected"
                : "Message from Nemufy"}
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-100/80">
            {application.messageToApplicant}
          </p>
        </section>
      ) : null}

      {messages.length > 0 ? (
        <section className="border-border bg-surface mt-6 rounded-2xl border p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <MessageSquare className="text-primary size-4" /> Conversation
          </h2>
          <div className="mt-5 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="bg-background/55 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold">
                    {message.authorType === "admin" ? "Nemufy" : "You"}
                  </p>
                  <time className="text-subtle text-xs">
                    {message.createdAt.toDate().toLocaleString()}
                  </time>
                </div>
                <p className="text-muted-foreground mt-2 text-sm leading-6 whitespace-pre-wrap">
                  {message.message}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ApplicantApplicationActions
        applicationId={application.id}
        status={application.status}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-subtle text-xs uppercase">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
