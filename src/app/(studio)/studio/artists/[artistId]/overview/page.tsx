import Link from "next/link";
import { ArrowRight, FileMusic, Music2 } from "lucide-react";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistById } from "@/lib/firebase/firestore/repositories/artists";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";

export default async function ArtistOverviewPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  await requireActiveUser();
  const { artistId } = await params;
  const [artist, releases, tracks] = await Promise.all([
    getArtistById(artistId),
    getReleasesForArtist(artistId),
    getTracksForArtist(artistId),
  ]);
  if (!artist) return null;
  const drafts = releases.filter((release) => release.status === "draft");
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Artist Studio"
        title={artist.displayName || artist.name}
        description="Catalog operations, identity and team access for this artist."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total plays"
          value={tracks
            .reduce((sum, track) => sum + track.playCount, 0)
            .toLocaleString()}
          note="Catalog data"
        />
        <StatCard
          label="Monthly listeners"
          value={artist.monthlyListeners.toLocaleString()}
          note="Development metric"
        />
        <StatCard
          label="Followers"
          value={artist.followerCount.toLocaleString()}
        />
        <StatCard label="Releases" value={releases.length} />
        <StatCard label="Tracks" value={tracks.length} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="border-border bg-surface rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Latest releases</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Real Firestore catalog
              </p>
            </div>
            <Link
              href={`/studio/artists/${artistId}/releases`}
              className="text-primary flex items-center gap-1 text-xs"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {releases.slice(0, 4).map((release) => (
              <div
                key={release.id}
                className="bg-background/50 flex items-center gap-3 rounded-xl p-3"
              >
                <FileMusic className="text-primary size-4" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {release.title}
                  </p>
                  <p className="text-subtle text-xs capitalize">
                    {release.type}
                  </p>
                </div>
                <StatusBadge status={release.status} />
              </div>
            ))}
            {releases.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No releases yet.
              </p>
            )}
          </div>
        </section>
        <section className="border-border bg-surface rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Draft releases</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Needs work before publication
              </p>
            </div>
            <Link
              href={`/studio/artists/${artistId}/releases/new`}
              className="text-primary text-xs"
            >
              Create release
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {drafts.slice(0, 4).map((release) => (
              <Link
                key={release.id}
                href={`/studio/artists/${artistId}/releases/${release.id}`}
                className="bg-background/50 hover:bg-background flex items-center gap-3 rounded-xl p-3"
              >
                <Music2 className="size-4 text-amber-200" />
                <span className="flex-1 truncate text-sm font-medium">
                  {release.title}
                </span>
                <StatusBadge status="draft" />
              </Link>
            ))}
            {drafts.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No drafts. Your catalog is tidy.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
