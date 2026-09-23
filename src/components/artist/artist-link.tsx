import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { ArtistReference } from "@/types/catalog";
import { cn } from "@/lib/utils";

type ArtistLinkProps = {
  artist: ArtistReference;
  className?: string;
  showVerified?: boolean;
};

export function ArtistLink({
  artist,
  className,
  showVerified = false,
}: ArtistLinkProps) {
  return (
    <Link
      href={`/artist/${artist.slug}`}
      className={cn(
        "hover:text-foreground inline-flex items-center gap-1 hover:underline",
        className,
      )}
    >
      {artist.displayName}
      {showVerified && artist.verified ? (
        <BadgeCheck
          className="fill-primary text-background size-3.5"
          aria-label="Verified"
        />
      ) : null}
    </Link>
  );
}

export function ArtistCredits({
  artists,
  featuredArtists = [],
  className,
}: {
  artists: ArtistReference[];
  featuredArtists?: ArtistReference[];
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-center", className)}>
      {artists.map((artist, index) => (
        <span key={artist.id}>
          {index > 0 ? ", " : ""}
          <ArtistLink artist={artist} />
        </span>
      ))}
      {featuredArtists.length > 0 ? (
        <span>
          <span className="mx-1.5 opacity-50">•</span>feat.{" "}
          {featuredArtists.map((artist, index) => (
            <span key={artist.id}>
              {index > 0 ? ", " : ""}
              <ArtistLink artist={artist} />
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}
