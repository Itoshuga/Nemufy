import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminOverviewCounts } from "@/lib/firebase/firestore/repositories/admin-dashboard";
import { listAuditLogs } from "@/lib/firebase/firestore/repositories/audit-logs";

export default async function ManageAdminOverviewPage() {
  const [counts, activity] = await Promise.all([
    getAdminOverviewCounts(),
    listAuditLogs(8),
  ]);
  return (
    <BackofficePage
      eyebrow="Administration"
      title="Overview"
      description="The few platform signals that matter right now."
    >
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Metric
          label="Requests waiting"
          value={counts.requests}
          href="/manage/admin/requests"
        />
        <Metric label="Users" value={counts.users} href="/manage/admin/users" />
        <Metric
          label="Artists"
          value={counts.artists}
          href="/manage/admin/artists"
        />
        <Metric
          label="Labels"
          value={counts.labels}
          href="/manage/admin/labels"
        />
        <Metric
          label="Releases"
          value={counts.releases}
          href="/manage/admin/music"
        />
        <Metric
          label="Tracks"
          value={counts.tracks}
          href="/manage/admin/music?view=tracks"
        />
      </div>
      <section className="border-border bg-surface mt-10 max-w-4xl rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Recent activity</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Sensitive actions recorded by trusted server operations.
            </p>
          </div>
          <Link
            href="/manage/admin/audit-logs"
            className="text-primary flex items-center gap-1 text-xs font-semibold"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        </div>
        {activity.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Administrative changes will appear here."
            />
          </div>
        ) : (
          <div className="mt-4 divide-y divide-white/6">
            {activity.map((event) => (
              <div key={event.id} className="flex items-center gap-4 py-3">
                <span className="bg-primary/10 text-primary grid size-8 place-items-center rounded-lg">
                  <Activity className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {humanizeAction(event.action)}
                  </p>
                  <p className="text-subtle mt-0.5 truncate text-xs">
                    {event.targetType.charAt(0).toUpperCase() +
                      event.targetType.slice(1)}
                  </p>
                </div>
                <time className="text-subtle text-xs">
                  {event.createdAt.toDate().toLocaleString()}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>
    </BackofficePage>
  );
}

function Metric({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="border-border bg-surface hover:border-primary/35 rounded-2xl border p-5 transition-colors"
    >
      <p className="font-display text-3xl font-semibold">
        {value.toLocaleString()}
      </p>
      <p className="text-subtle mt-2 text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </p>
    </Link>
  );
}

function humanizeAction(action: string) {
  return action
    .replaceAll(".", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
