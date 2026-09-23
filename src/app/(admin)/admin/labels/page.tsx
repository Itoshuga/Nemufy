import Link from "next/link";
import { Building2 } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAllArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { getLabelTeam } from "@/lib/firebase/firestore/repositories/label-memberships";
import { listLabels } from "@/lib/firebase/firestore/repositories/labels";

export default async function AdminLabelsPage() {
  const labels = await listLabels();
  const counts = await Promise.all(
    labels.map(async (label) => {
      const [artists, team] = await Promise.all([
        getAllArtistsForLabel(label.id),
        getLabelTeam(label.id),
      ]);
      return { artists: artists.length, team: team.length };
    }),
  );
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Organizations"
        title="Labels"
        description="Verification, status, artist relationships and teams."
      />
      <div className="mt-8">
        {labels.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No labels"
            description="Label organizations will appear here once created."
          />
        ) : (
          <DataTable
            label="Labels"
            columns={["Label", "Status", "Verified", "Artists", "Members"]}
          >
            {labels.map((label, index) => (
              <tr key={label.id}>
                <DataCell>
                  <Link
                    href={`/admin/labels/${label.id}`}
                    className="text-primary font-medium"
                  >
                    {label.name}
                  </Link>
                  <p className="text-subtle text-xs">{label.id}</p>
                </DataCell>
                <DataCell>
                  <StatusBadge status={label.status} />
                </DataCell>
                <DataCell>{label.verified ? "Yes" : "No"}</DataCell>
                <DataCell>{counts[index].artists}</DataCell>
                <DataCell>{counts[index].team}</DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
