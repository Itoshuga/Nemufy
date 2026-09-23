import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import { ReleaseCard } from "@/components/release/release-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/home/section-header";
import { playlists, releases } from "@/data/mock/catalog";

export const metadata: Metadata = { title: "Your Library" };

export default function LibraryPage() {
  return (
    <div className="page-container">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-primary mb-2 text-[11px] font-semibold tracking-[.18em] uppercase">
            Saved for later
          </p>
          <h1 className="font-display text-foreground text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
            Your Library
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            A calm corner for everything you want to hear again.
          </p>
        </div>
        <Button variant="secondary">
          <Plus aria-hidden="true" />
          New playlist
        </Button>
      </div>

      <section id="playlists" className="page-section !mt-0 scroll-mt-24">
        <SectionHeader title="Playlists for you" />
        <div className="card-grid">
          {playlists.slice(0, 5).map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>

      <section className="page-section">
        <SectionHeader title="Recently explored" />
        <div className="card-grid">
          {releases.slice(0, 5).map((release) => (
            <ReleaseCard key={release.id} release={release} />
          ))}
        </div>
      </section>

      <section id="liked" className="page-section scroll-mt-24">
        <SectionHeader title="Liked tracks" />
        <EmptyState
          icon={Heart}
          title="Your liked tracks will live here"
          description="The heart buttons already work in this prototype. Account persistence will arrive with authentication."
          action={
            <Button asChild variant="secondary">
              <Link href="/">Explore Nemufy</Link>
            </Button>
          }
        />
      </section>
    </div>
  );
}
