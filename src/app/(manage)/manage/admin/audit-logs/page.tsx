import Link from "next/link";
import { Activity } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getAuditLogDisplayNames,
  listAuditLogsPage,
} from "@/lib/firebase/firestore/repositories/audit-logs";

export default async function ManageAdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const page = await listAuditLogsPage(cursor);
  const logs = page.logs;
  const names = await getAuditLogDisplayNames(logs);
  return (
    <BackofficePage
      eyebrow="Administration"
      title="Audit Logs"
      description="A readable history of sensitive actions. Technical metadata stays tucked away."
    >
      <div className="mt-8">
        {logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No audit events"
            description="Sensitive server operations will appear here."
          />
        ) : (
          <DataTable
            label="Audit logs"
            columns={["When", "Who", "Action", "Target", "Details"]}
          >
            {logs.map((log) => (
              <tr key={log.id}>
                <DataCell>{log.createdAt.toDate().toLocaleString()}</DataCell>
                <DataCell>
                  <span className="text-xs">
                    {names.actors.get(log.actorUserId) ?? "Nemufy member"}
                  </span>
                </DataCell>
                <DataCell>
                  <span className="font-medium">{humanize(log.action)}</span>
                </DataCell>
                <DataCell>
                  <p className="text-xs capitalize">{log.targetType}</p>
                  <p className="text-muted-foreground max-w-40 truncate text-xs">
                    {names.targets.get(`${log.targetType}:${log.targetId}`) ??
                      "Record"}
                  </p>
                </DataCell>
                <DataCell>
                  <details>
                    <summary className="text-primary cursor-pointer text-xs">
                      Technical details
                    </summary>
                    <pre className="text-subtle mt-2 max-w-72 overflow-auto text-[10px]">
                      {JSON.stringify(
                        {
                          actorUserId: log.actorUserId,
                          targetId: log.targetId,
                          ...(log.metadata ? { metadata: log.metadata } : {}),
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
      {page.nextCursor ? (
        <div className="mt-5 flex justify-end">
          <Button asChild variant="secondary">
            <Link
              href={`/manage/admin/audit-logs?cursor=${encodeURIComponent(page.nextCursor)}`}
            >
              Next page
            </Link>
          </Button>
        </div>
      ) : null}
    </BackofficePage>
  );
}

function humanize(value: string) {
  return value
    .replaceAll(".", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
