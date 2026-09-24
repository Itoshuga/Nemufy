import Link from "next/link";
import { ArrowRight, FileMusic, Pencil, Plus } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistById } from "@/lib/firebase/firestore/repositories/artists";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";
import { can } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ManageArtistOverviewPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const { user } = await requireActiveUser();
  const [artist, releases, tracks, permissionContext] = await Promise.all([
    getArtistById(artistId),
    getReleasesForArtist(artistId),
    getTracksForArtist(artistId),
    getArtistPermissionContext(user.uid, artistId, user.claims.admin),
  ]);
  if (!artist) return null;
  const drafts = releases.filter((release) => release.status === "draft");
  const canCreate = can(permissionContext, "release:create");
  return (
    <BackofficePage
      eyebrow="Artist overview"
      title={artist.displayName || artist.name}
      description={`${artist.monthlyListeners.toLocaleString()} monthly listeners · ${tracks.reduce((sum, track) => sum + track.playCount, 0).toLocaleString()} plays`}
      action={
        canCreate ? (
          <Button asChild>
            <Link href={`/manage/artists/${artistId}/music/new`}>
              <Plus /> New release
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        <OverviewMetric label="Releases" value={releases.length} />
        <OverviewMetric label="Tracks" value={tracks.length} />
        <OverviewMetric
          label="Followers"
          value={artist.followerCount.toLocaleString()}
        />
        <OverviewMetric label="Drafts" value={drafts.length} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link href={`/manage/artists/${artistId}/profile`}>
            <Pencil /> Edit profile
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <OverviewList
          title="Latest releases"
          href={`/manage/artists/${artistId}/music`}
        >
          {releases.length === 0 ? (
            <EmptyState
              icon={FileMusic}
              title="No releases yet"
              description="Create your first single, EP or album."
            />
          ) : (
            releases.slice(0, 5).map((release) => (
              <Link
                key={release.id}
                href={`/manage/releases/${release.id}`}
                className="bg-background/45 hover:bg-background flex items-center gap-3 rounded-xl p-3"
              >
                <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-lg">
                  <FileMusic className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {release.title}
                  </span>
                  <span className="text-subtle text-xs uppercase">
                    {release.type}
                  </span>
                </span>
                <StatusBadge status={release.status} />
              </Link>
            ))
          )}
        </OverviewList>

        {drafts.length > 0 ? (
          <OverviewList
            title="Drafts"
            href={`/manage/artists/${artistId}/music?status=draft`}
          >
            {drafts.slice(0, 5).map((release) => (
              <Link
                key={release.id}
                href={`/manage/releases/${release.id}`}
                className="bg-background/45 hover:bg-background flex items-center justify-between rounded-xl p-3"
              >
                <span className="truncate text-sm font-medium">
                  {release.title}
                </span>
                <StatusBadge status="draft" />
              </Link>
            ))}
          </OverviewList>
        ) : null}
      </div>
    </BackofficePage>
  );
}

function OverviewMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border-border bg-surface/70 rounded-xl border p-4">
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-subtle mt-1 text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
}

function OverviewList({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link
          href={href}
          className="text-primary flex items-center gap-1 text-xs font-semibold"
        >
          View all <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}
