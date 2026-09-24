import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { ApplicationForm } from "@/components/applications/application-form";
import { Button } from "@/components/ui/button";

export default function ArtistApplicationPage() {
  return (
    <div className="page-container mx-auto max-w-4xl pb-20">
      <Link
        href="/creator/artist/claim"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" /> Search artists
      </Link>
      <header className="mt-7 max-w-2xl">
        <p className="text-primary text-[11px] font-semibold tracking-[.18em] uppercase">
          New artist
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-.045em]">
          Create my artist page
        </h1>
        <p className="text-muted-foreground mt-3 leading-7">
          Submit the essentials. Your full profile can be completed after an
          administrator approves the application.
        </p>
      </header>
      <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-400/15 bg-amber-400/6 p-4">
        <p className="text-sm text-amber-100">
          Before creating a new artist, check whether your profile already
          exists.
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/creator/artist/claim">
            <Search /> Search
          </Link>
        </Button>
      </div>
      <ApplicationForm type="artist_creation" />
    </div>
  );
}
