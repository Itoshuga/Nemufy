import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-surface-hover animate-pulse rounded-xl", className)}
      {...props}
    />
  );
}
