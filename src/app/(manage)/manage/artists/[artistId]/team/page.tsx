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
import { getArtistTeam } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getInvitations } from "@/lib/firebase/firestore/repositories/invitations";
import { can } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ManageArtistTeamPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const { user } = await requireActiveUser();
  const [team, invitations, context] = await Promise.all([
    getArtistTeam(artistId),
    getInvitations("artist", artistId),
    getArtistPermissionContext(user.uid, artistId, user.claims.admin),
  ]);
  const canManage = can(context, "artist:manage-team");
  return (
    <BackofficePage
      eyebrow="Artist"
      title="Team"
      description="People who can access this artist. Roles keep permissions understandable."
      action={
        canManage ? (
          <ManageDrawer
            title="Invite member"
            description="Choose a simple role. Advanced permissions remain exceptional."
            trigger={
              <Button>
                <Plus /> Invite
              </Button>
            }
          >
            <InviteMemberForm type="artist" targetId={artistId} />
          </ManageDrawer>
        ) : undefined
      }
    >
      <div className="mt-8">
        <DataTable
          label="Artist team"
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
                    type="artist"
                    targetId={artistId}
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
              <DataCell>
                <p className="font-medium">
                  {canManage ? invitation.email : "Invitation"}
                </p>
              </DataCell>
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
  if (role === "owner") return "Everything";
  if (role === "manager") return "Edit and publish content";
  if (role === "editor") return "Create and edit content";
  return "Read-only";
}
