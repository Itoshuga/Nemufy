import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status?: string | null }) {
  const normalizedStatus = status?.trim() || "unknown";
  const positive = ["active", "published", "verified"].includes(
    normalizedStatus,
  );
  const warning = ["draft", "pending", "scheduled", "trialing"].includes(
    normalizedStatus,
  );
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
        positive
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : warning
            ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
            : "text-muted-foreground border-white/10 bg-white/5",
      )}
    >
      {normalizedStatus.replaceAll("_", " ")}
    </span>
  );
}
