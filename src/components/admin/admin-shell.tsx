"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  Album,
  ArrowLeft,
  Building2,
  Disc3,
  LayoutDashboard,
  ListMusic,
  Music2,
  Settings,
  Shield,
  Tags,
  Users,
} from "lucide-react";
import type { AppUser } from "@/components/auth/user-menu";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

const navigation = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/users", "Users", Users],
  ["/admin/artists", "Artists", Disc3],
  ["/admin/labels", "Labels", Building2],
  ["/admin/releases", "Releases", Album],
  ["/admin/tracks", "Tracks", Music2],
  ["/admin/playlists", "Playlists", ListMusic],
  ["/admin/categories", "Categories", Tags],
  ["/admin/moderation", "Moderation", Shield],
  ["/admin/audit-logs", "Audit Logs", Activity],
  ["/admin/platform", "Platform", Settings],
  ["/admin/settings", "Settings", Settings],
] as const;

export function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: AppUser;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-[#090b13] text-white lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-border border-b bg-[#0d101c] p-4 lg:min-h-dvh lg:border-r lg:border-b-0 lg:p-5">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-rose-400/15 text-rose-300">
            <Shield className="size-5" />
          </span>
          <span>
            <span className="block font-semibold">Nemufy</span>
            <span className="text-subtle text-[10px] tracking-[.18em] uppercase">
              Administration
            </span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mt-5 flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" /> Listening app
        </Link>
        <nav
          className="mt-6 flex gap-2 overflow-x-auto lg:block lg:space-y-1"
          aria-label="Admin navigation"
        >
          {navigation.map(([href, label, Icon]) => {
            const active =
              href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-rose-400/12 text-rose-200"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="border-border bg-background/85 sticky top-0 z-30 flex h-18 items-center justify-between border-b px-4 backdrop-blur-xl sm:px-8">
          <div>
            <p className="text-subtle text-[10px] font-semibold tracking-[.15em] uppercase">
              Secure workspace
            </p>
            <p className="text-sm font-semibold">Admin Panel</p>
          </div>
          <UserMenu user={user} />
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
