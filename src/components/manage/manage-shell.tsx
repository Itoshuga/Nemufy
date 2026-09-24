"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  Disc3,
  LayoutDashboard,
  ListMusic,
  Menu,
  Music2,
  PanelLeftClose,
  Settings2,
  Users,
  X,
} from "lucide-react";
import type { AppUser } from "@/components/auth/user-menu";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";
import type { StudioContext } from "@/types/platform";

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

function getNavigation(pathname: string): NavigationItem[] {
  const artistId = pathname.match(/^\/manage\/artists\/([^/]+)/)?.[1];
  if (artistId) {
    const root = `/manage/artists/${artistId}`;
    return [
      { href: root, label: "Overview", icon: LayoutDashboard, exact: true },
      { href: `${root}/music`, label: "Music", icon: Music2 },
      { href: `${root}/profile`, label: "Profile", icon: Disc3 },
      { href: `${root}/team`, label: "Team", icon: Users },
    ];
  }

  const labelId = pathname.match(/^\/manage\/labels\/([^/]+)/)?.[1];
  if (labelId) {
    const root = `/manage/labels/${labelId}`;
    return [
      { href: root, label: "Overview", icon: LayoutDashboard, exact: true },
      { href: `${root}/artists`, label: "Artists", icon: Disc3 },
      { href: `${root}/music`, label: "Music", icon: Music2 },
      { href: `${root}/team`, label: "Team", icon: Users },
      { href: `${root}/profile`, label: "Profile", icon: Building2 },
    ];
  }

  if (pathname.startsWith("/manage/admin")) {
    return [
      {
        href: "/manage/admin",
        label: "Overview",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: "/manage/admin/users", label: "Users", icon: Users },
      { href: "/manage/admin/artists", label: "Artists", icon: Disc3 },
      { href: "/manage/admin/labels", label: "Labels", icon: Building2 },
      { href: "/manage/admin/music", label: "Music", icon: Music2 },
      {
        href: "/manage/admin/playlists",
        label: "Playlists",
        icon: ListMusic,
      },
      { href: "/manage/admin/platform", label: "Platform", icon: Settings2 },
      {
        href: "/manage/admin/audit-logs",
        label: "Audit Logs",
        icon: Activity,
      },
    ];
  }

  return [{ href: "/manage", label: "Contexts", icon: PanelLeftClose }];
}

function getCurrentContextValue(pathname: string) {
  const artistId = pathname.match(/^\/manage\/artists\/([^/]+)/)?.[1];
  if (artistId) return `artist:${artistId}`;
  const labelId = pathname.match(/^\/manage\/labels\/([^/]+)/)?.[1];
  if (labelId) return `label:${labelId}`;
  if (pathname.startsWith("/manage/admin")) return "admin:nemufy";
  return "";
}

export function ManageShell({
  children,
  contexts,
  isAdmin,
  user,
}: {
  children: ReactNode;
  contexts: StudioContext[];
  isAdmin: boolean;
  user: AppUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = getNavigation(pathname);
  const contextValue = getCurrentContextValue(pathname);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const switchContext = (value: string) => {
    setMobileOpen(false);
    const [type, id] = value.split(":");
    if (type === "artist" && id) router.push(`/manage/artists/${id}`);
    if (type === "label" && id) router.push(`/manage/labels/${id}`);
    if (type === "admin") router.push("/manage/admin");
  };

  return (
    <div className="manage-shell">
      <button
        type="button"
        className={cn("manage-overlay", mobileOpen && "is-open")}
        aria-label="Close navigation"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />
      <aside className={cn("manage-sidebar", mobileOpen && "is-open")}>
        <div className="flex items-center justify-between">
          <Link
            href="/manage"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-xl">
              <Disc3 className="size-4.5" />
            </span>
            <span>
              <span className="font-display block text-lg font-semibold tracking-tight">
                nemufy
              </span>
              <span className="text-subtle block text-[9px] font-semibold tracking-[.19em] uppercase">
                Backoffice
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-lg lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-8 lg:hidden">
          <ContextSelect
            contexts={contexts}
            isAdmin={isAdmin}
            value={contextValue}
            onChange={switchContext}
          />
        </div>

        <nav className="mt-8 space-y-1" aria-label="Backoffice navigation">
          {navigation.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="text-muted-foreground hover:text-foreground mt-auto flex items-center gap-2 px-3 py-2 text-xs"
        >
          <ArrowLeft className="size-3.5" /> Back to Nemufy
        </Link>
      </aside>

      <div className="manage-workspace">
        <header className="manage-header">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="border-border bg-surface grid size-9 shrink-0 place-items-center rounded-xl border lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </button>
            <div className="hidden min-w-0 lg:block">
              <ContextSelect
                contexts={contexts}
                isAdmin={isAdmin}
                value={contextValue}
                onChange={switchContext}
              />
            </div>
            <p className="text-muted-foreground truncate text-sm font-medium lg:hidden">
              {navigation.find((item) =>
                item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href),
              )?.label ?? "Backoffice"}
            </p>
          </div>
          <UserMenu user={user} backoffice />
        </header>
        <main id="main-content" className="manage-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function ContextSelect({
  contexts,
  isAdmin,
  value,
  onChange,
}: {
  contexts: StudioContext[];
  isAdmin: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const artists = contexts.filter((context) => context.type === "artist");
  const labels = contexts.filter((context) => context.type === "label");
  const isLinkedArtistWorkspace =
    value.startsWith("artist:") &&
    !artists.some((context) => `artist:${context.id}` === value);
  return (
    <label className="block min-w-0">
      <span className="text-subtle block text-[9px] font-semibold tracking-[.16em] uppercase">
        Managing
      </span>
      <select
        aria-label="Management context"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="text-foreground mt-0.5 max-w-56 border-0 bg-transparent py-1 text-sm font-semibold outline-none"
      >
        {!value && <option value="">Choose a context</option>}
        {artists.length > 0 && (
          <optgroup label="MY ARTISTS">
            {artists.map((context) => (
              <option key={context.id} value={`artist:${context.id}`}>
                {context.name}
              </option>
            ))}
          </optgroup>
        )}
        {labels.length > 0 && (
          <optgroup label="LABELS">
            {labels.map((context) => (
              <option key={context.id} value={`label:${context.id}`}>
                {context.name}
              </option>
            ))}
          </optgroup>
        )}
        {isLinkedArtistWorkspace && (
          <optgroup label="CURRENT WORKSPACE">
            <option value={value}>Linked artist</option>
          </optgroup>
        )}
        {isAdmin && (
          <optgroup label="NEMUFY">
            <option value="admin:nemufy">Administration</option>
          </optgroup>
        )}
      </select>
    </label>
  );
}
