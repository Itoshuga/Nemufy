"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { UserMenu, type AppUser } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";

const pageNames: Record<string, string> = {
  "/": "Discover",
  "/search": "Search",
  "/library": "Your Library",
};

export function AppHeader({ user }: { user: AppUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const sectionName =
    pageNames[pathname] ??
    (pathname.startsWith("/artist")
      ? "Artist"
      : pathname.startsWith("/release")
        ? "Release"
        : pathname.startsWith("/playlist")
          ? "Playlist"
          : "Nemufy");

  return (
    <header className="app-header">
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1 sm:flex">
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={() => router.forward()}
            aria-label="Go forward"
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="sm:hidden">
          <p className="text-muted-foreground text-xs font-semibold tracking-[.13em] uppercase">
            {sectionName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="hidden sm:inline-flex"
        >
          <Link href="/search">
            <Search aria-hidden="true" />
            Search
          </Link>
        </Button>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
