import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { ApplicationForm } from "@/components/applications/application-form";
import { Button } from "@/components/ui/button";
import { getArtistOwnership } from "@/lib/firebase/firestore/repositories/artist-ownerships";
import {
  getArtistById,
  listArtists,
} from "@/lib/firebase/firestore/repositories/artists";
import { countReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";

export default async function ArtistClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; artist?: string }>;
}) {
  const filters = await searchParams;
  const query = filters.q?.trim().toLowerCase() ?? "";
  const [artists, selectedArtist] = await Promise.all([
    listArtists(100),
    filters.artist ? getArtistById(filters.artist) : Promise.resolve(null),
  ]);
  const visibleArtists = query
    ? artists
        .filter((artist) =>
          (artist.displayName || artist.name).toLowerCase().includes(query),
        )
        .slice(0, 12)
    : [];
  const [ownership, releaseCount] = selectedArtist
    ? await Promise.all([
        getArtistOwnership(selectedArtist.id),
        countReleasesForArtist(selectedArtist.id),
      ])
    : [null, 0];
  const claimed =
    selectedArtist?.claimStatus === "claimed" || Boolean(ownership);

  return (
    <div className="page-container mx-auto max-w-4xl pb-20">
      <Link
        href="/creator"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" /> Creator access
      </Link>
      <header className="mt-7 max-w-2xl">
        <p className="text-primary text-[11px] font-semibold tracking-[.18em] uppercase">
          Artist
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-.045em]">
          Find your artist profile
        </h1>
        <p className="text-muted-foreground mt-3 leading-7">
          Search Nemufy before creating a new page. Claimed profiles cannot be
          claimed again.
        </p>
      </header>

      <form className="relative mt-8 flex gap-2">
        <label className="relative flex-1">
          <Search className="text-subtle absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            name="q"
            defaultValue={filters.q}
            className="manage-input pl-10"
            placeholder="Search artists…"
            autoFocus
          />
        </label>
        <Button>Search</Button>
      </form>

      {query && !selectedArtist ? (
        <div className="mt-5 space-y-2">
          {visibleArtists.map((artist) => (
            <Link
              key={artist.id}
              href={`/creator/artist/claim?q=${encodeURIComponent(filters.q ?? "")}&artist=${artist.id}`}
              className="border-border bg-surface hover:border-primary/35 flex items-center justify-between rounded-xl border p-4"
            >
              <span className="font-medium">
                {artist.displayName || artist.name}
              </span>
              <span className="text-subtle text-xs">
                {artist.claimStatus === "claimed"
                  ? "Already claimed"
                  : "Select"}
              </span>
            </Link>
          ))}
          {visibleArtists.length === 0 ? (
            <div className="border-border bg-surface rounded-2xl border p-5">
              <p className="font-medium">Can&apos;t find yourself?</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Request a new artist profile instead.
              </p>
              <Button asChild variant="secondary" className="mt-4">
                <Link href="/creator/artist/apply">Create my artist page</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedArtist ? (
        <>
          <section className="border-border bg-surface mt-6 rounded-2xl border p-5">
            <p className="text-subtle text-[10px] font-semibold tracking-wide uppercase">
              Is this you?
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {selectedArtist.displayName || selectedArtist.name}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Artist profile · {releaseCount} releases ·{" "}
              {selectedArtist.monthlyListeners.toLocaleString()} monthly
              listeners
            </p>
          </section>
          {claimed ? (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/8 p-5 text-sm text-amber-100">
              This artist has already been claimed. Ask its owner to invite you
              from Artist Studio → Team.
            </div>
          ) : (
            <ApplicationForm
              type="artist_claim"
              artist={{
                id: selectedArtist.id,
                name: selectedArtist.displayName || selectedArtist.name,
              }}
            />
          )}
        </>
      ) : null}

      <p className="text-muted-foreground mt-8 text-sm">
        No existing profile?{" "}
        <Link
          href="/creator/artist/apply"
          className="text-primary font-semibold"
        >
          Request a new artist page
        </Link>
        .
      </p>
    </div>
  );
}
