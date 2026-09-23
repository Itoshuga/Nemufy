import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="border-border bg-surface/40 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed px-6 text-center">
      <div className="bg-surface-hover text-primary mb-5 grid size-12 place-items-center rounded-2xl">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
