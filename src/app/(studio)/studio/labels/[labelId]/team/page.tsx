import { InviteMemberForm } from "@/components/studio/invite-member-form";
import { MemberActions } from "@/components/studio/member-actions";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getInvitations } from "@/lib/firebase/firestore/repositories/invitations";
import { getLabelTeam } from "@/lib/firebase/firestore/repositories/label-memberships";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function LabelTeamPage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const { user } = await requireActiveUser();
  const [team, invitations, context] = await Promise.all([
    getLabelTeam(labelId),
    getInvitations("label", labelId),
    requireLabelPermission(user.uid, user.claims.admin, labelId, "label:view"),
  ]);
  const canManage = can(context, "label:manage-team");
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Label"
        title="Team"
        description="Owner, Admin, Manager and Editor roles map to centralized permission presets."
      />
      {canManage && (
        <div className="mt-8">
          <InviteMemberForm type="label" targetId={labelId} />
        </div>
      )}
      <div className="mt-6">
        <DataTable
          label="Label team"
          columns={["Member", "Email", "Role", "Status", "Actions"]}
        >
          {team.map(({ membership, user: member, email }) => (
            <tr key={membership.id}>
              <DataCell>
                <p className="font-medium">
                  {member?.displayName ?? member?.username ?? "Pending user"}
                </p>
              </DataCell>
              <DataCell>{canManage ? (email ?? "—") : "Hidden"}</DataCell>
              <DataCell className="capitalize">{membership.role}</DataCell>
              <DataCell>
                <StatusBadge status={membership.status} />
              </DataCell>
              <DataCell>
                {canManage && membership.status === "active" ? (
                  <MemberActions
                    type="label"
                    targetId={labelId}
                    membershipId={membership.id}
                    role={membership.role}
                  />
                ) : (
                  "—"
                )}
              </DataCell>
            </tr>
          ))}
          {invitations.map((invitation) => (
            <tr key={invitation.id}>
              <DataCell>Invitation</DataCell>
              <DataCell>{canManage ? invitation.email : "Hidden"}</DataCell>
              <DataCell className="capitalize">{invitation.role}</DataCell>
              <DataCell>
                <StatusBadge status={invitation.status} />
              </DataCell>
              <DataCell>—</DataCell>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
