import Link from "next/link";
import { ArrowRight, Building2, Disc3, Plus } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { getLabelById } from "@/lib/firebase/firestore/repositories/labels";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function ManageLabelOverviewPage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const { user } = await requireActiveUser();
  const [label, artists, context] = await Promise.all([
    getLabelById(labelId),
    getArtistsForLabel(labelId),
    requireLabelPermission(user.uid, user.claims.admin, labelId, "label:view"),
  ]);
  if (!label) return null;
  const [releaseGroups, trackGroups] = await Promise.all([
    Promise.all(artists.map(({ artist }) => getReleasesForArtist(artist.id))),
    Promise.all(artists.map(({ artist }) => getTracksForArtist(artist.id))),
  ]);
  const releases = [
    ...new Map(
      releaseGroups.flat().map((release) => [release.id, release]),
    ).values(),
  ];
  const tracks = [
    ...new Map(trackGroups.flat().map((track) => [track.id, track])).values(),
  ];
  const canManageArtists = can(context, "label:manage-artists");

  return (
    <BackofficePage
      eyebrow="Label overview"
      title={label.name}
      description={`${artists.length} artists · ${releases.length} releases · ${tracks.length} tracks`}
      action={
        canManageArtists ? (
          <Button asChild>
            <Link href={`/manage/labels/${labelId}/artists`}>
              <Plus /> Add artist
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Artists" value={artists.length} />
        <Metric label="Releases" value={releases.length} />
        <Metric label="Tracks" value={tracks.length} />
        <Metric
          label="Total plays"
          value={tracks
            .reduce((sum, track) => sum + track.playCount, 0)
            .toLocaleString()}
        />
      </div>
      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <section className="border-border bg-surface rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Artists</h2>
            <Link
              href={`/manage/labels/${labelId}/artists`}
              className="text-primary flex items-center gap-1 text-xs font-semibold"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {artists.slice(0, 5).map(({ artist, relation }) => (
              <Link
                key={artist.id}
                href={`/manage/artists/${artist.id}`}
                className="bg-background/45 hover:bg-background flex items-center gap-3 rounded-xl p-3"
              >
                <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-lg">
                  <Disc3 className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {artist.displayName || artist.name}
                </span>
                <StatusBadge status={relation.status} />
              </Link>
            ))}
            {artists.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No artists yet.
              </p>
            ) : null}
          </div>
        </section>
        <section className="border-border bg-surface rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Latest releases</h2>
            <Link
              href={`/manage/labels/${labelId}/music`}
              className="text-primary flex items-center gap-1 text-xs font-semibold"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {releases.slice(0, 5).map((release) => (
              <Link
                key={release.id}
                href={`/manage/releases/${release.id}`}
                className="bg-background/45 hover:bg-background flex items-center gap-3 rounded-xl p-3"
              >
                <Building2 className="text-primary size-4" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {release.title}
                </span>
                <StatusBadge status={release.status} />
              </Link>
            ))}
            {releases.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No releases yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </BackofficePage>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-border bg-surface/70 rounded-xl border p-4">
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-subtle mt-1 text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
}
