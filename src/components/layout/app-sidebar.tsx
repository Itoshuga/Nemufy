"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Heart,
  Home,
  Library,
  ListMusic,
  MoonStar,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNavigation = [
  { href: "/", label: "Discover", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Your Library", icon: Library },
];

const secondaryNavigation = [
  { href: "/library#liked", label: "Liked", icon: Heart },
  { href: "/library#playlists", label: "Playlists", icon: ListMusic },
];

function NavigationLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group focus-visible:ring-ring flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2",
        active
          ? "bg-surface-hover text-foreground"
          : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
      )}
    >
      <Icon
        className={cn("size-[18px]", active && "text-primary")}
        aria-hidden="true"
      />
      <span className="lg:inline">{label}</span>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar border-border bg-sidebar border-r px-4 py-6">
      <Link
        href="/"
        className="focus-visible:ring-ring mb-8 flex items-center gap-3 rounded-lg px-2 outline-none focus-visible:ring-2"
        aria-label="Nemufy home"
      >
        <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-xl shadow-[0_8px_24px_rgba(142,124,229,.2)]">
          <MoonStar className="size-5" aria-hidden="true" />
        </span>
        <span className="font-display text-xl font-semibold tracking-[-.04em]">
          nemufy
        </span>
      </Link>

      <nav aria-label="Primary navigation" className="space-y-1">
        {primaryNavigation.map((item) => (
          <NavigationLink
            key={item.href}
            {...item}
            active={
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </nav>

      <div className="bg-border my-5 h-px" />

      <p className="text-subtle mb-2 px-3 text-[10px] font-semibold tracking-[.18em] uppercase">
        Collection
      </p>
      <nav aria-label="Collection navigation" className="space-y-1">
        {secondaryNavigation.map((item) => (
          <NavigationLink key={item.href} {...item} active={false} />
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/5 bg-[linear-gradient(145deg,var(--color-surface),rgba(137,120,218,.08))] p-4">
        <Compass className="text-primary mb-3 size-5" aria-hidden="true" />
        <p className="text-foreground text-sm font-medium">Find your quiet</p>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          A calmer listening space, made for headphones.
        </p>
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="mobile-navigation" aria-label="Mobile navigation">
      {primaryNavigation.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-[18px]" aria-hidden="true" />
            {item.label === "Your Library" ? "Library" : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
