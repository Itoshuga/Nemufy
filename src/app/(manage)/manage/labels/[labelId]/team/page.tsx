import { Plus } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { ManageDrawer } from "@/components/manage/manage-drawer";
import { InviteMemberForm } from "@/components/studio/invite-member-form";
import { MemberActions } from "@/components/studio/member-actions";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getInvitations } from "@/lib/firebase/firestore/repositories/invitations";
import { getLabelTeam } from "@/lib/firebase/firestore/repositories/label-memberships";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function ManageLabelTeamPage({
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
    <BackofficePage
      eyebrow="Label"
      title="Team"
      description="The same simple roles used across the entire Backoffice."
      action={
        canManage ? (
          <ManageDrawer
            title="Invite member"
            description="Choose a role that matches the person’s responsibilities."
            trigger={
              <Button>
                <Plus /> Invite
              </Button>
            }
          >
            <InviteMemberForm type="label" targetId={labelId} />
          </ManageDrawer>
        ) : undefined
      }
    >
      <div className="mt-8">
        <DataTable
          label="Label team"
          columns={["Person", "Role", "Access", "Status", "Actions"]}
        >
          {team.map(({ membership, user: member, email }) => (
            <tr key={membership.id}>
              <DataCell>
                <p className="font-medium">
                  {member?.displayName ?? member?.username ?? "Pending user"}
                </p>
                <p className="text-subtle mt-1 text-xs">
                  {canManage ? (email ?? "—") : "Email hidden"}
                </p>
              </DataCell>
              <DataCell>
                <RoleBadge role={membership.role} />
              </DataCell>
              <DataCell>
                <span className="text-xs">{roleSummary(membership.role)}</span>
              </DataCell>
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
              <DataCell>{canManage ? invitation.email : "Invitation"}</DataCell>
              <DataCell>
                <RoleBadge role={invitation.role} />
              </DataCell>
              <DataCell>
                <span className="text-xs">{roleSummary(invitation.role)}</span>
              </DataCell>
              <DataCell>
                <StatusBadge status={invitation.status} />
              </DataCell>
              <DataCell>—</DataCell>
            </tr>
          ))}
        </DataTable>
      </div>
    </BackofficePage>
  );
}

function roleSummary(role: string) {
  if (role === "owner" || role === "admin") return "Everything";
  if (role === "manager") return "Manage and publish content";
  if (role === "editor") return "Create and edit content";
  return "Read-only";
}
