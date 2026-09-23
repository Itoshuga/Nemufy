import Link from "next/link";

export function SectionHeader({
  title,
  eyebrow,
  href,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-primary mb-1 text-[11px] font-semibold tracking-[.18em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md text-xs font-semibold tracking-[.1em] uppercase transition-colors outline-none focus-visible:ring-2"
        >
          View all
        </Link>
      ) : null}
    </div>
  );
}
