import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { getLabelById } from "@/lib/firebase/firestore/repositories/labels";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";

export default async function LabelOverviewPage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const [label, artists] = await Promise.all([
    getLabelById(labelId),
    getArtistsForLabel(labelId),
  ]);
  if (!label) return null;
  const releaseGroups = await Promise.all(
    artists.map(({ artist }) => getReleasesForArtist(artist.id)),
  );
  const trackGroups = await Promise.all(
    artists.map(({ artist }) => getTracksForArtist(artist.id)),
  );
  const releases = [
    ...new Map(
      releaseGroups.flat().map((release) => [release.id, release]),
    ).values(),
  ];
  const tracks = [
    ...new Map(trackGroups.flat().map((track) => [track.id, track])).values(),
  ];
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Label Studio"
        title={label.name}
        description="Artists, teams and catalog operations for this label context."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Artists" value={artists.length} />
        <StatCard label="Releases" value={releases.length} />
        <StatCard label="Tracks" value={tracks.length} />
        <StatCard
          label="Total plays"
          value={tracks
            .reduce((sum, track) => sum + track.playCount, 0)
            .toLocaleString()}
          note="Stored data"
        />
        <StatCard
          label="Followers"
          value={artists
            .reduce((sum, item) => sum + item.artist.followerCount, 0)
            .toLocaleString()}
        />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="border-border bg-surface rounded-2xl border p-5">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">Artists</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Active label relationships
              </p>
            </div>
            <Link
              href={`/studio/labels/${labelId}/artists`}
              className="text-primary flex items-center gap-1 text-xs"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {artists.slice(0, 4).map(({ artist, relation }) => (
              <Link
                key={artist.id}
                href={`/studio/artists/${artist.id}/overview`}
                className="bg-background/50 hover:bg-background flex items-center gap-3 rounded-xl p-3"
              >
                <Building2 className="text-primary size-4" />
                <span className="flex-1 font-medium">
                  {artist.displayName || artist.name}
                </span>
                <StatusBadge status={relation.status} />
              </Link>
            ))}
          </div>
        </section>
        <section className="border-border bg-surface rounded-2xl border p-5">
          <p className="font-semibold">Recent releases</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Across linked artists
          </p>
          <div className="mt-5 space-y-3">
            {releases.slice(0, 4).map((release) => (
              <div
                key={release.id}
                className="bg-background/50 flex items-center gap-3 rounded-xl p-3"
              >
                <span className="flex-1 truncate text-sm font-medium">
                  {release.title}
                </span>
                <StatusBadge status={release.status} />
              </div>
            ))}
            {releases.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No catalog yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
