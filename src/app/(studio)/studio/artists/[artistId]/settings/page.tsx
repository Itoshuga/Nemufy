import { LabelArtistActions } from "@/components/studio/label-artist-actions";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getLabelRelationsForArtist } from "@/lib/firebase/firestore/repositories/label-artists";
import { getLabelById } from "@/lib/firebase/firestore/repositories/labels";
import { can } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ArtistSettingsPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const { user } = await requireActiveUser();
  const [relations, context] = await Promise.all([
    getLabelRelationsForArtist(artistId),
    getArtistPermissionContext(user.uid, artistId, user.claims.admin),
  ]);
  const labels = await Promise.all(
    relations.map((relation) => getLabelById(relation.labelId)),
  );
  const canManageTeam = can(context, "artist:manage-team");
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Artist"
        title="Settings"
        description="Ownership transfer and archival belong here. Destructive deletion is intentionally unavailable."
      />
      <div className="border-border bg-surface mt-8 rounded-2xl border p-6">
        <h2 className="font-semibold">Lifecycle policy</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Nemufy archives artist identities instead of immediately deleting
          their catalog. Ownership transfer will require a dedicated, audited
          server workflow.
        </p>
      </div>
      <section className="border-border bg-surface mt-6 rounded-2xl border p-6">
        <h2 className="font-semibold">Label relationships</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Artist team owners control whether a pending label relationship
          becomes active.
        </p>
        <div className="mt-5 space-y-3">
          {relations.map((relation, index) => (
            <div
              key={relation.id}
              className="bg-background/50 flex flex-wrap items-center gap-3 rounded-xl p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {labels[index]?.name ?? relation.labelId}
                </p>
                <p className="text-subtle text-xs">{relation.labelId}</p>
              </div>
              <StatusBadge status={relation.status} />
              {canManageTeam && relation.status === "pending" && (
                <LabelArtistActions
                  labelId={relation.labelId}
                  artistId={artistId}
                  action="activate"
                />
              )}
            </div>
          ))}
          {relations.length === 0 && (
            <p className="text-muted-foreground text-sm">Independent artist</p>
          )}
        </div>
      </section>
    </div>
  );
}
