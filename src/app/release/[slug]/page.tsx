import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReleaseHeader } from "@/components/release/collection-header";
import { ReleaseCard } from "@/components/release/release-card";
import { SectionHeader } from "@/components/home/section-header";
import { TrackList } from "@/components/track/track-list";
import { releases } from "@/data/mock/catalog";
import { getReleaseBySlug } from "@/data/mock/selectors";

type ReleasePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return releases.map((release) => ({ slug: release.slug }));
}

export async function generateMetadata({
  params,
}: ReleasePageProps): Promise<Metadata> {
  const release = getReleaseBySlug((await params).slug);
  return release
    ? { title: release.title, description: release.description }
    : { title: "Release not found" };
}

export default async function ReleasePage({ params }: ReleasePageProps) {
  const release = getReleaseBySlug((await params).slug);
  if (!release) notFound();

  const primaryArtistIds = new Set(release.artists.map((artist) => artist.id));
  const moreByArtists = releases
    .filter(
      (candidate) =>
        candidate.id !== release.id &&
        candidate.artists.some((artist) => primaryArtistIds.has(artist.id)),
    )
    .slice(0, 5);

  return (
    <div className="page-container">
      <ReleaseHeader release={release} />
      <section className="page-section !mt-10">
        <TrackList tracks={release.tracks} />
        <div className="border-border text-subtle mt-6 border-t pt-5 text-xs leading-5">
          <p>
            {new Date(release.releaseDate).toLocaleDateString("en", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p>{release.copyright}</p>
        </div>
      </section>
      {moreByArtists.length > 0 ? (
        <section className="page-section">
          <SectionHeader
            title={`More from ${release.artists[0]?.displayName ?? "this artist"}`}
          />
          <div className="card-grid">
            {moreByArtists.map((item) => (
              <ReleaseCard key={item.id} release={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
