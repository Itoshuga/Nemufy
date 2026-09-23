import type { ReactNode } from "react";

export function ManagementPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-primary text-xs font-semibold tracking-[.16em] uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <p className="text-subtle text-[10px] font-semibold tracking-[.14em] uppercase">
        {label}
      </p>
      <p className="font-display mt-3 text-3xl font-semibold">{value}</p>
      {note && <p className="text-muted-foreground mt-2 text-xs">{note}</p>}
    </div>
  );
}
