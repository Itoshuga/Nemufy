import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { getArtistById } from "@/lib/firebase/firestore/repositories/artists";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";

export default async function ArtistAnalyticsPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const [artist, tracks] = await Promise.all([
    getArtistById(artistId),
    getTracksForArtist(artistId),
  ]);
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Audience · Development preview"
        title="Analytics"
        description="Real catalog counters are separated from placeholder listening analytics until the event pipeline is implemented."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Catalog plays"
          value={tracks
            .reduce((sum, track) => sum + track.playCount, 0)
            .toLocaleString()}
          note="Stored data"
        />
        <StatCard
          label="Monthly listeners"
          value={(artist?.monthlyListeners ?? 0).toLocaleString()}
          note="Seed/development metric"
        />
        <StatCard
          label="Followers"
          value={(artist?.followerCount ?? 0).toLocaleString()}
          note="Stored aggregate"
        />
        <StatCard label="Completion rate" value="—" note="Not collected yet" />
      </div>
      <div className="border-border bg-surface mt-8 rounded-2xl border p-8">
        <p className="font-semibold">Top tracks</p>
        <p className="text-muted-foreground mt-2 text-sm">
          This area is ready for the future analytics pipeline. It does not
          invent production listening events.
        </p>
      </div>
    </div>
  );
}
