import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "border-border bg-surface text-muted-foreground inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[.12em] uppercase",
        className,
      )}
      {...props}
    />
  );
}
