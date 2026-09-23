"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  Album,
  ArrowLeft,
  BarChart3,
  Disc3,
  LayoutDashboard,
  Menu,
  MoonStar,
  Music2,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import type { AppUser } from "@/components/auth/user-menu";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";
import type { StudioContext } from "@/types/platform";

type NavigationItem = { href: string; label: string; icon: typeof Menu };

function getNavigation(pathname: string): NavigationItem[] {
  const artist = pathname.match(/^\/studio\/artists\/([^/]+)/)?.[1];
  if (artist) {
    const root = `/studio/artists/${artist}`;
    return [
      { href: `${root}/overview`, label: "Overview", icon: LayoutDashboard },
      { href: `${root}/releases`, label: "Releases", icon: Album },
      { href: `${root}/tracks`, label: "Tracks", icon: Music2 },
      { href: `${root}/profile`, label: "Profile", icon: Disc3 },
      { href: `${root}/team`, label: "Team", icon: Users },
      { href: `${root}/analytics`, label: "Analytics", icon: BarChart3 },
      { href: `${root}/settings`, label: "Settings", icon: Settings },
    ];
  }
  const label = pathname.match(/^\/studio\/labels\/([^/]+)/)?.[1];
  if (label) {
    const root = `/studio/labels/${label}`;
    return [
      { href: `${root}/overview`, label: "Overview", icon: LayoutDashboard },
      { href: `${root}/artists`, label: "Artists", icon: Disc3 },
      { href: `${root}/catalog`, label: "Catalog", icon: Album },
      { href: `${root}/team`, label: "Team", icon: Users },
      { href: `${root}/analytics`, label: "Analytics", icon: BarChart3 },
      { href: `${root}/settings`, label: "Label profile", icon: Settings },
    ];
  }
  return [
    { href: "/studio", label: "Contexts", icon: Tags },
    { href: "/studio/activity", label: "Activity", icon: Activity },
  ];
}

export function StudioShell({
  children,
  contexts,
  user,
}: {
  children: ReactNode;
  contexts: StudioContext[];
  user: AppUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = getNavigation(pathname);
  const artistId = pathname.match(/^\/studio\/artists\/([^/]+)/)?.[1];
  const labelId = pathname.match(/^\/studio\/labels\/([^/]+)/)?.[1];
  const value = artistId
    ? `artist:${artistId}`
    : labelId
      ? `label:${labelId}`
      : "";

  return (
    <div className="min-h-dvh bg-[#0b0c15] text-white lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-border bg-sidebar border-b p-4 lg:min-h-dvh lg:border-r lg:border-b-0 lg:p-5">
        <div className="flex items-center justify-between lg:block">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Nemufy"
          >
            <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-xl">
              <MoonStar className="size-5" />
            </span>
            <span>
              <span className="font-display block text-lg font-semibold">
                nemufy
              </span>
              <span className="text-subtle block text-[10px] font-semibold tracking-[.2em] uppercase">
                Studio
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs lg:mt-5"
          >
            <ArrowLeft className="size-3.5" /> Listening app
          </Link>
        </div>

        <nav
          className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-10 lg:block lg:space-y-1"
          aria-label="Studio navigation"
        >
          {navigation.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/14 text-primary"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
              >
                <item.icon className="size-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="border-border bg-background/85 sticky top-0 z-30 flex h-18 items-center justify-between border-b px-4 backdrop-blur-xl sm:px-8">
          <label className="min-w-0">
            <span className="text-subtle block text-[10px] font-semibold tracking-[.15em] uppercase">
              Managing as
            </span>
            <select
              aria-label="Studio context"
              value={value}
              onChange={(event) => {
                const [type, id] = event.target.value.split(":");
                if (type && id) router.push(`/studio/${type}s/${id}/overview`);
              }}
              className="text-foreground max-w-[52vw] border-0 bg-transparent py-1 text-sm font-semibold outline-none"
            >
              {!value && <option value="">Choose a context</option>}
              <optgroup label="Artists">
                {contexts
                  .filter((context) => context.type === "artist")
                  .map((context) => (
                    <option
                      key={`artist:${context.id}`}
                      value={`artist:${context.id}`}
                    >
                      {context.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Labels">
                {contexts
                  .filter((context) => context.type === "label")
                  .map((context) => (
                    <option
                      key={`label:${context.id}`}
                      value={`label:${context.id}`}
                    >
                      {context.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </label>
          <UserMenu user={user} />
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
