import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export function BackofficePage({
  title,
  description,
  eyebrow,
  action,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="manage-page">
      <header className="manage-page-header">
        <div className="min-w-0">
          {eyebrow ? <p className="manage-eyebrow">{eyebrow}</p> : null}
          <h1 className="manage-page-title">{title}</h1>
          {description ? (
            <p className="manage-page-description">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </div>
  );
}

export function AccessDenied({ entity = "workspace" }: { entity?: string }) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center text-center">
      <span className="bg-surface text-primary grid size-14 place-items-center rounded-2xl border border-white/8">
        <LockKeyhole className="size-5" />
      </span>
      <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight">
        You don&apos;t have access to this {entity}.
      </h1>
      <p className="text-muted-foreground mt-3 text-sm leading-6">
        Choose another management context or ask an owner to review your team
        access.
      </p>
      <Link
        href="/manage"
        className="text-primary mt-6 inline-flex items-center gap-2 text-sm font-semibold"
      >
        <ArrowLeft className="size-4" /> Back to Backoffice
      </Link>
    </div>
  );
}
