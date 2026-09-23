import { Activity } from "lucide-react";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { listAuditLogs } from "@/lib/firebase/firestore/repositories/audit-logs";

export default async function AdminAuditLogsPage() {
  const logs = await listAuditLogs(250);
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Security"
        title="Audit Logs"
        description="Append-only records written exclusively by trusted server operations."
      />
      <div className="mt-8">
        {logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No audit events yet"
            description="Sensitive platform mutations will be recorded here."
          />
        ) : (
          <DataTable
            label="Audit logs"
            columns={["Time", "Actor", "Action", "Target", "Context"]}
          >
            {logs.map((log) => (
              <tr key={log.id}>
                <DataCell>{log.createdAt.toDate().toLocaleString()}</DataCell>
                <DataCell>
                  <span className="max-w-48 text-xs break-all">
                    {log.actorUserId}
                  </span>
                </DataCell>
                <DataCell>
                  <code className="text-primary text-xs">{log.action}</code>
                </DataCell>
                <DataCell>
                  <p className="text-xs">{log.targetType}</p>
                  <p className="text-subtle max-w-44 truncate text-xs">
                    {log.targetId}
                  </p>
                </DataCell>
                <DataCell>
                  <span className="text-xs">
                    {log.context.artistId
                      ? `Artist: ${log.context.artistId}`
                      : log.context.labelId
                        ? `Label: ${log.context.labelId}`
                        : "—"}
                  </span>
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}
