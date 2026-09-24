import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Sparkles, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

export type AppUser = {
  email: string;
  displayName: string;
  username: string | null;
  capabilities: {
    isPremium: boolean;
    isArtist: boolean;
    isLabelMember: boolean;
    isAdmin: boolean;
  };
};

export function UserMenu({
  user,
  backoffice = false,
}: {
  user: AppUser;
  backoffice?: boolean;
}) {
  return (
    <details className="user-menu relative">
      <summary className="border-border bg-surface hover:bg-surface-hover focus-visible:ring-ring flex cursor-pointer list-none items-center gap-2 rounded-full border py-1 pr-3 pl-1 transition-colors outline-none focus-visible:ring-2">
        <span className="bg-primary/15 text-primary grid size-7 place-items-center rounded-full">
          <Sparkles className="size-3.5" />
        </span>
        <span className="text-foreground hidden max-w-32 truncate text-xs font-medium sm:inline">
          {user.displayName}
        </span>
      </summary>
      <div className="border-border bg-surface absolute top-[calc(100%+.6rem)] right-0 z-50 w-64 rounded-2xl border p-3 shadow-2xl">
        <div className="flex items-start gap-3 px-2 py-2">
          <span className="bg-surface-hover text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full">
            <UserRound className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-semibold">
              {user.displayName}
            </p>
            <p className="text-subtle truncate text-xs">
              {user.username ? `@${user.username}` : user.email}
            </p>
          </div>
        </div>
        <div className="bg-border my-2 h-px" />
        <nav className="space-y-1" aria-label="Account destinations">
          {backoffice && (
            <Link
              href="/"
              className="text-muted-foreground hover:bg-surface-hover hover:text-foreground flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors"
            >
              <ArrowLeft className="size-4" /> Back to Nemufy
            </Link>
          )}
          <Link
            href="/profile"
            className="text-muted-foreground hover:bg-surface-hover hover:text-foreground flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors"
          >
            <UserRound className="size-4" /> Profile
          </Link>
          {(user.capabilities.isArtist ||
            user.capabilities.isLabelMember ||
            user.capabilities.isAdmin) &&
            !backoffice && (
              <Link
                href="/manage"
                className="text-muted-foreground hover:bg-surface-hover hover:text-foreground flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors"
              >
                <LayoutDashboard className="size-4" /> Manage content
              </Link>
            )}
        </nav>
        <div className="bg-border my-2 h-px" />
        <LogoutButton />
      </div>
    </details>
  );
}
