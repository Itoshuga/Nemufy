import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, TriangleAlert } from "lucide-react";
import { AdminApplicationActions } from "@/components/applications/admin-application-actions";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import {
  applicationSubject,
  applicationTypeLabels,
} from "@/lib/applications/display";
import {
  getApplicationById,
  getApplicationRelatedRecords,
  listApplicationMessages,
} from "@/lib/firebase/firestore/repositories/applications";
import { listArtists } from "@/lib/firebase/firestore/repositories/artists";
import { getActiveLabelRelationsForArtist } from "@/lib/firebase/firestore/repositories/label-artists";
import {
  getLabelById,
  listLabels,
} from "@/lib/firebase/firestore/repositories/labels";
import { countReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const application = await getApplicationById(applicationId);
  if (!application) notFound();
  const [related, messages, allArtists, allLabels] = await Promise.all([
    getApplicationRelatedRecords([application]),
    listApplicationMessages(applicationId),
    application.type === "artist_creation"
      ? listArtists(100)
      : Promise.resolve([]),
    application.type === "label_creation"
      ? listLabels(100)
      : Promise.resolve([]),
  ]);
  const applicant = related.applicants.get(application.applicantUserId);
  const artist = application.artistId
    ? related.artists.get(application.artistId)
    : null;
  const artistDetails = artist ? await getArtistReviewDetails(artist.id) : null;
  const requestedName =
    application.requestedArtist?.name ?? application.requestedLabel?.name;
  const similarArtists = application.requestedArtist
    ? findSimilar(
        application.requestedArtist.name,
        allArtists.map((candidate) => ({
          id: candidate.id,
          name: candidate.displayName || candidate.name,
          claimed: candidate.claimStatus === "claimed",
        })),
      )
    : [];
  const similarLabels = application.requestedLabel
    ? findSimilar(
        application.requestedLabel.name,
        allLabels.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
        })),
      )
    : [];
  const title =
    application.type === "artist_claim"
      ? `${applicant?.displayName ?? applicant?.username ?? "Applicant"} wants to claim ${artist?.displayName ?? artist?.name ?? "an artist"}`
      : applicationSubject(application);
  const approveDescription =
    application.type === "artist_claim"
      ? `${applicant?.displayName ?? "The applicant"} will become the owner of ${artist?.displayName ?? artist?.name ?? "this artist"} and receive access to manage it.`
      : application.type === "artist_creation"
        ? `${requestedName ?? "The artist"} will be created and the applicant will become its owner.`
        : `${requestedName ?? "The label"} will be created and the applicant will become its owner.`;

  return (
    <BackofficePage
      eyebrow={applicationTypeLabels[application.type]}
      title={title}
      description={`Submitted ${application.createdAt.toDate().toLocaleString()}`}
      action={<ApplicationStatusBadge status={application.status} />}
    >
      <Link
        href="/manage/admin/requests"
        className="text-muted-foreground hover:text-foreground mt-5 inline-flex items-center gap-2 text-xs font-semibold"
      >
        <ArrowLeft className="size-3.5" /> Requests
      </Link>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        <div className="space-y-6">
          <section className="border-border bg-surface rounded-2xl border p-6">
            <h2 className="font-semibold">Submitted information</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Detail
                label="Applicant"
                value={
                  applicant?.displayName ??
                  applicant?.username ??
                  "Nemufy member"
                }
              />
              {applicant?.username ? (
                <Detail label="Username" value={`@${applicant.username}`} />
              ) : null}
              {application.type === "artist_claim" ? (
                <>
                  <Detail
                    label="Artist"
                    value={artist?.displayName ?? artist?.name ?? "Unavailable"}
                  />
                  <LinkDetail
                    label="Website"
                    href={application.evidence?.websiteUrl}
                  />
                  <Detail
                    label="Contact email"
                    value={application.evidence?.contactEmail ?? "—"}
                  />
                </>
              ) : application.type === "artist_creation" ? (
                <>
                  <Detail
                    label="Artist name"
                    value={application.requestedArtist?.name ?? "—"}
                  />
                  <LinkDetail
                    label="Website"
                    href={application.requestedArtist?.websiteUrl}
                  />
                  <Detail
                    label="Biography"
                    value={application.requestedArtist?.biography ?? "—"}
                    wide
                  />
                </>
              ) : (
                <>
                  <Detail
                    label="Label name"
                    value={application.requestedLabel?.name ?? "—"}
                  />
                  <LinkDetail
                    label="Website"
                    href={application.requestedLabel?.websiteUrl}
                  />
                  <Detail
                    label="Representative role"
                    value={application.representativeRole ?? "—"}
                  />
                  <Detail
                    label="Description"
                    value={application.requestedLabel?.description ?? "—"}
                    wide
                  />
                </>
              )}
              <SocialLinks application={application} />
              <Detail label="Message" value={application.message ?? "—"} wide />
            </dl>
          </section>

          {artistDetails ? (
            <section className="border-border bg-surface rounded-2xl border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-subtle text-[10px] font-semibold tracking-wide uppercase">
                    Artist profile
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {artist?.displayName ?? artist?.name}
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {artist?.claimStatus === "claimed"
                      ? "Claimed"
                      : "Unclaimed"}{" "}
                    · {artistDetails.releases} releases · {artistDetails.tracks}{" "}
                    tracks
                  </p>
                  <p className="text-subtle mt-1 text-xs">
                    Label: {artistDetails.labelName ?? "Independent"}
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/manage/artists/${artist?.id}`}>
                    Open artist
                  </Link>
                </Button>
              </div>
            </section>
          ) : null}

          {similarArtists.length > 0 || similarLabels.length > 0 ? (
            <section className="rounded-2xl border border-amber-400/20 bg-amber-400/7 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-amber-100">
                <TriangleAlert className="size-4" /> Possible duplicate
              </h2>
              <div className="mt-3 space-y-2 text-sm text-amber-100/80">
                {[...similarArtists, ...similarLabels].map((candidate) => (
                  <p key={candidate.id}>
                    {candidate.name}
                    {"claimed" in candidate && candidate.claimed
                      ? " · Claimed"
                      : ""}
                  </p>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="border-border bg-surface rounded-2xl border p-6">
            <h2 className="font-semibold">Activity</h2>
            <div className="mt-5 space-y-5 border-l border-white/10 pl-5">
              <Activity
                label="Application submitted"
                date={application.createdAt.toDate()}
              />
              {messages.map((message) => (
                <Activity
                  key={message.id}
                  label={
                    message.authorType === "admin"
                      ? "Information requested"
                      : "Applicant replied"
                  }
                  date={message.createdAt.toDate()}
                  message={message.message}
                />
              ))}
              {application.reviewedAt ? (
                <Activity
                  label={
                    application.status === "approved"
                      ? "Application approved"
                      : application.status === "rejected"
                        ? "Application rejected"
                        : "Application completed"
                  }
                  date={application.reviewedAt.toDate()}
                />
              ) : null}
            </div>
          </section>
          <details className="border-border bg-surface rounded-2xl border p-5">
            <summary className="cursor-pointer text-sm font-semibold">
              Technical details
            </summary>
            <dl className="text-subtle mt-4 space-y-3 font-mono text-xs break-all">
              <div>
                <dt>Application</dt>
                <dd>{application.id}</dd>
              </div>
              <div>
                <dt>Applicant</dt>
                <dd>{application.applicantUserId}</dd>
              </div>
              {application.artistId ? (
                <div>
                  <dt>Artist</dt>
                  <dd>{application.artistId}</dd>
                </div>
              ) : null}
            </dl>
          </details>
        </aside>
      </div>

      <AdminApplicationActions
        applicationId={application.id}
        type={application.type}
        status={application.status}
        approveDescription={approveDescription}
        artistOptions={allArtists
          .filter((candidate) => candidate.claimStatus !== "claimed")
          .map((candidate) => ({
            id: candidate.id,
            name: candidate.displayName || candidate.name,
          }))}
      />
    </BackofficePage>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-subtle text-xs uppercase">{label}</dt>
      <dd className="mt-2 text-sm leading-6 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function LinkDetail({ label, href }: { label: string; href?: string }) {
  return (
    <div>
      <dt className="text-subtle text-xs uppercase">{label}</dt>
      <dd className="mt-2 text-sm">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary inline-flex items-center gap-1 break-all"
          >
            {href} <ExternalLink className="size-3" />
          </a>
        ) : (
          "—"
        )}
      </dd>
    </div>
  );
}

function SocialLinks({
  application,
}: {
  application: Awaited<ReturnType<typeof getApplicationById>> & {};
}) {
  if (!application) return null;
  const urls =
    application.evidence?.socialUrls ??
    application.requestedArtist?.socialUrls ??
    application.requestedLabel?.socialUrls ??
    [];
  return (
    <div className="sm:col-span-2">
      <dt className="text-subtle text-xs uppercase">Social links</dt>
      <dd className="mt-2 space-y-1 text-sm">
        {urls.length > 0
          ? urls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-primary block break-all"
              >
                {url}
              </a>
            ))
          : "—"}
      </dd>
    </div>
  );
}

function Activity({
  label,
  date,
  message,
}: {
  label: string;
  date: Date;
  message?: string;
}) {
  return (
    <div className="relative">
      <span className="bg-primary absolute top-1 -left-[1.38rem] size-2 rounded-full" />
      <p className="text-sm font-medium">{label}</p>
      <time className="text-subtle mt-1 block text-xs">
        {date.toLocaleString()}
      </time>
      {message ? (
        <p className="text-muted-foreground mt-2 line-clamp-4 text-xs leading-5">
          {message}
        </p>
      ) : null}
    </div>
  );
}

async function getArtistReviewDetails(artistId: string) {
  const [releases, tracks, relations] = await Promise.all([
    countReleasesForArtist(artistId),
    getTracksForArtist(artistId),
    getActiveLabelRelationsForArtist(artistId),
  ]);
  const label = relations[0] ? await getLabelById(relations[0].labelId) : null;
  return { releases, tracks: tracks.length, labelName: label?.name };
}

function findSimilar<T extends { id: string; name: string }>(
  name: string,
  candidates: T[],
) {
  const normalized = name.trim().toLowerCase();
  const words = normalized.split(/\s+/).filter((word) => word.length > 2);
  return candidates
    .filter((candidate) => {
      const candidateName = candidate.name.toLowerCase();
      return (
        candidateName.includes(normalized) ||
        normalized.includes(candidateName) ||
        words.some((word) => candidateName.includes(word))
      );
    })
    .slice(0, 8);
}
