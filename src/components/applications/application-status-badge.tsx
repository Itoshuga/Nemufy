import { cn } from "@/lib/utils";
import { applicationStatusLabels } from "@/lib/applications/display";
import type { ApplicationStatus } from "@/types/firestore";

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
        status === "approved" &&
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        (status === "pending" || status === "under_review") &&
          "border-sky-400/20 bg-sky-400/10 text-sky-200",
        status === "needs_information" &&
          "border-amber-400/20 bg-amber-400/10 text-amber-200",
        status === "rejected" &&
          "border-rose-400/20 bg-rose-400/10 text-rose-200",
        status === "cancelled" &&
          "text-muted-foreground border-white/10 bg-white/5",
      )}
    >
      {applicationStatusLabels[status]}
    </span>
  );
}
