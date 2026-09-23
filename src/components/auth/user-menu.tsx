import { Sparkles, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

export type AppUser = {
  email: string;
  displayName: string;
  username: string | null;
};

export function UserMenu({ user }: { user: AppUser }) {
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
        <LogoutButton />
      </div>
    </details>
  );
}
