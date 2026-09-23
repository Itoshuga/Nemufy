import Link from "next/link";
import { ArrowRight, Headphones, Sparkles } from "lucide-react";
import { CoverImage } from "@/components/media/cover-image";
import { PlayButton } from "@/components/player/play-button";
import { Button } from "@/components/ui/button";
import type { Release } from "@/types/catalog";

export function DiscoverHero({ release }: { release: Release }) {
  return (
    <section className="hero-panel">
      <div className="hero-glow" />
      <div className="relative z-10 max-w-2xl">
        <div className="text-primary mb-5 flex items-center gap-2 text-[11px] font-semibold tracking-[.18em] uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Nemufy nightly selection
        </div>
        <h1 className="font-display text-foreground max-w-xl text-4xl font-semibold tracking-[-.045em] text-balance sm:text-5xl lg:text-6xl">
          A quieter place to land.
        </h1>
        <p className="text-muted-foreground mt-5 max-w-lg text-sm leading-7 sm:text-base">
          Slow down with close whispers, distant rain and immersive sounds
          chosen for the space between today and sleep.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <PlayButton tracks={release.tracks} label size="lg" />
          <Button asChild variant="secondary" size="lg">
            <Link href={`/release/${release.slug}`}>
              View release <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="text-subtle mt-8 flex items-center gap-2 text-xs">
          <Headphones className="size-4" aria-hidden="true" />
          Best experienced with headphones
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="hero-orbit" />
        <CoverImage
          src={release.cover}
          alt=""
          priority
          sizes="420px"
          className="aspect-square w-full rounded-[2rem] shadow-[0_35px_100px_rgba(0,0,0,.48)]"
        />
      </div>
    </section>
  );
}
