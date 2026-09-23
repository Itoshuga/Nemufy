import Link from "next/link";
import { MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-container flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span className="bg-primary/15 text-primary mb-5 grid size-14 place-items-center rounded-2xl">
        <MoonStar className="size-6" />
      </span>
      <p className="text-primary text-xs font-semibold tracking-[.16em] uppercase">
        404 · Lost in a dream
      </p>
      <h1 className="text-foreground mt-3 text-3xl font-semibold">
        This page drifted away
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-6">
        The artist, release or playlist you’re looking for does not exist.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Return to Discover</Link>
      </Button>
    </div>
  );
}
