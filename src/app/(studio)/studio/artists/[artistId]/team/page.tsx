import { ManagementPageHeader } from "@/components/studio/page-header";
import { InviteMemberForm } from "@/components/studio/invite-member-form";
import { MemberActions } from "@/components/studio/member-actions";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistTeam } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getInvitations } from "@/lib/firebase/firestore/repositories/invitations";
import { can } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ArtistTeamPage({
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
    <div>
      <ManagementPageHeader
        eyebrow="Artist"
        title="Team"
        description="Membership roles apply centralized permission presets. Context selection never grants access by itself."
      />
      {canManage && (
        <div className="mt-8">
          <InviteMemberForm type="artist" targetId={artistId} />
        </div>
      )}
      <div className="mt-6">
        <DataTable
          label="Artist team"
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
                <p className="font-medium">Invitation</p>
              </DataCell>
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
