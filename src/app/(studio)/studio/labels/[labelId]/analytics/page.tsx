import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { getArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";

export default async function LabelAnalyticsPage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const artists = await getArtistsForLabel(labelId);
  const trackGroups = await Promise.all(
    artists.map(({ artist }) => getTracksForArtist(artist.id)),
  );
  const tracks = [
    ...new Map(trackGroups.flat().map((track) => [track.id, track])).values(),
  ];
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Label · Development preview"
        title="Analytics"
        description="Only stored catalog aggregates are presented as real data. Performance trends remain placeholders until event collection exists."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Artists" value={artists.length} />
        <StatCard
          label="Catalog plays"
          value={tracks
            .reduce((sum, track) => sum + track.playCount, 0)
            .toLocaleString()}
          note="Stored data"
        />
        <StatCard label="Audience trend" value="—" note="Not collected yet" />
        <StatCard
          label="Release performance"
          value="—"
          note="Not collected yet"
        />
      </div>
    </div>
  );
}
