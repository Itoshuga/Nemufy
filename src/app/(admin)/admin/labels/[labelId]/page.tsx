import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAllArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { getLabelTeam } from "@/lib/firebase/firestore/repositories/label-memberships";
import { getLabelById } from "@/lib/firebase/firestore/repositories/labels";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { listAuditLogs } from "@/lib/firebase/firestore/repositories/audit-logs";

export default async function AdminLabelDetailPage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const [label, artists, team, auditLogs] = await Promise.all([
    getLabelById(labelId),
    getAllArtistsForLabel(labelId),
    getLabelTeam(labelId),
    listAuditLogs(200),
  ]);
  if (!label) notFound();
  const releases = (
    await Promise.all(
      artists.map(({ artist }) => getReleasesForArtist(artist.id)),
    )
  ).flat();
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Label details"
        title={label.name}
        description="Profile, artists, team and aggregate catalog with full administrative visibility."
        actions={
          <Link
            href={`/studio/labels/${labelId}/settings`}
            className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Manage label
          </Link>
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Artists" value={artists.length} />
        <StatCard label="Members" value={team.length} />
        <StatCard
          label="Releases"
          value={new Set(releases.map((release) => release.id)).size}
        />
      </div>
      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Audit history</h2>
        <DataTable
          label="Label audit history"
          columns={["Action", "Actor", "Target", "Date"]}
        >
          {auditLogs
            .filter((entry) => entry.context.labelId === labelId)
            .slice(0, 30)
            .map((entry) => (
              <tr key={entry.id}>
                <DataCell>{entry.action}</DataCell>
                <DataCell>{entry.actorUserId}</DataCell>
                <DataCell>{entry.targetId}</DataCell>
                <DataCell>{entry.createdAt.toDate().toLocaleString()}</DataCell>
              </tr>
            ))}
        </DataTable>
      </section>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold">Artists</h2>
          <DataTable
            label="Label artists"
            columns={["Artist", "Relation", "Status"]}
          >
            {artists.map(({ artist, relation }) => (
              <tr key={artist.id}>
                <DataCell>{artist.displayName || artist.name}</DataCell>
                <DataCell>
                  <StatusBadge status={relation.status} />
                </DataCell>
                <DataCell>
                  <StatusBadge status={artist.status ?? "active"} />
                </DataCell>
              </tr>
            ))}
          </DataTable>
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Team</h2>
          <DataTable label="Label team" columns={["Member", "Role", "Status"]}>
            {team.map(({ membership, user }) => (
              <tr key={membership.id}>
                <DataCell>
                  {user?.displayName ?? user?.username ?? membership.userId}
                </DataCell>
                <DataCell className="capitalize">{membership.role}</DataCell>
                <DataCell>
                  <StatusBadge status={membership.status} />
                </DataCell>
              </tr>
            ))}
          </DataTable>
        </section>
      </div>
    </div>
  );
}
