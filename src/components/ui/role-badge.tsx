import { cn } from "@/lib/utils";

export function RoleBadge({ role }: { role: string }) {
  const privileged = role === "owner" || role === "admin";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
        privileged
          ? "border-primary/20 bg-primary/10 text-primary"
          : role === "viewer"
            ? "text-muted-foreground border-white/8 bg-white/4"
            : "border-sky-400/20 bg-sky-400/10 text-sky-200",
      )}
    >
      {role}
    </span>
  );
}
