import type { ReactNode } from "react";
import { SectionHeader } from "@/components/home/section-header";
import { cn } from "@/lib/utils";

export function HorizontalSection({
  title,
  eyebrow,
  href,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("page-section", className)}>
      <SectionHeader title={title} eyebrow={eyebrow} href={href} />
      <div className="card-grid">{children}</div>
    </section>
  );
}
