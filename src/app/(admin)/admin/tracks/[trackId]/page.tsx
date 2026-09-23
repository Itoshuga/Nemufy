import { notFound } from "next/navigation";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTrackById } from "@/lib/firebase/firestore/repositories/tracks";

export default async function AdminTrackDetailPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;
  const track = await getTrackById(trackId);
  if (!track) notFound();
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Track details"
        title={track.title}
        description="Structured credits and immutable media location information."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Status" value={track.status} />
        <StatCard label="Duration" value={`${track.durationSeconds}s`} />
        <StatCard label="Track number" value={track.trackNumber ?? "—"} />
        <StatCard label="Plays" value={track.playCount.toLocaleString()} />
      </div>
      <section className="border-border bg-surface mt-8 rounded-2xl border p-6">
        <div className="flex justify-between">
          <h2 className="font-semibold">Metadata</h2>
          <StatusBadge
            status={track.audioStoragePath ? "active" : "missing audio"}
          />
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-subtle text-xs uppercase">Release</dt>
            <dd className="mt-1">{track.releaseId ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-subtle text-xs uppercase">Primary artists</dt>
            <dd className="mt-1">{track.primaryArtistIds.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-subtle text-xs uppercase">Featured artists</dt>
            <dd className="mt-1">
              {track.featuredArtistIds.join(", ") || "None"}
            </dd>
          </div>
          <div>
            <dt className="text-subtle text-xs uppercase">Storage path</dt>
            <dd className="mt-1 break-all">{track.audioStoragePath ?? "—"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
