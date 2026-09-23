import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminOverviewCounts } from "@/lib/firebase/firestore/repositories/admin-dashboard";
import { listAuditLogs } from "@/lib/firebase/firestore/repositories/audit-logs";
import { listReleases } from "@/lib/firebase/firestore/repositories/releases";
import { listUsers } from "@/lib/firebase/firestore/repositories/users";

export default async function AdminOverviewPage() {
  const [counts, users, releases, auditLogs] = await Promise.all([
    getAdminOverviewCounts(),
    listUsers(5),
    listReleases(5),
    listAuditLogs(5),
  ]);
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Platform"
        title="Overview"
        description="Operational visibility across accounts, organizations and the catalog."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCard label="Users" value={counts.users} />
        <StatCard label="Premium" value={counts.premiumUsers} />
        <StatCard label="Artists" value={counts.artists} />
        <StatCard label="Labels" value={counts.labels} />
        <StatCard label="Releases" value={counts.releases} />
        <StatCard label="Published tracks" value={counts.publishedTracks} />
        <StatCard label="Playlists" value={counts.playlists} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <AdminList title="Recent registrations" href="/admin/users">
          {users.map((user) => (
            <Link
              key={user.uid}
              href={`/admin/users/${user.uid}`}
              className="bg-background/50 flex items-center justify-between rounded-xl p-3"
            >
              <span className="truncate text-sm font-medium">
                {user.displayName ?? user.email ?? user.uid}
              </span>
              <StatusBadge status={user.accountStatus} />
            </Link>
          ))}
        </AdminList>
        <AdminList title="Recent releases" href="/admin/releases">
          {releases.map((release) => (
            <div
              key={release.id}
              className="bg-background/50 flex items-center justify-between rounded-xl p-3"
            >
              <span className="truncate text-sm font-medium">
                {release.title}
              </span>
              <StatusBadge status={release.status} />
            </div>
          ))}
        </AdminList>
        <AdminList
          title="Recent administrative actions"
          href="/admin/audit-logs"
        >
          {auditLogs.map((log) => (
            <div key={log.id} className="bg-background/50 rounded-xl p-3">
              <p className="text-sm font-medium">{log.action}</p>
              <p className="text-subtle mt-1 truncate text-xs">
                {log.actorUserId} → {log.targetId}
              </p>
            </div>
          ))}
        </AdminList>
      </div>
    </div>
  );
}

function AdminList({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface rounded-2xl border p-5">
      <div className="flex justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link
          href={href}
          className="text-primary flex items-center gap-1 text-xs"
        >
          View all <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}
