import { redirect } from "next/navigation";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { ReleaseForm } from "@/components/studio/release-form";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function ManageNewLabelReleasePage({
  params,
}: {
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const { user } = await requireActiveUser();
  const [artists, context] = await Promise.all([
    getArtistsForLabel(labelId),
    requireLabelPermission(user.uid, user.claims.admin, labelId, "label:view"),
  ]);
  if (!can(context, "label:manage-artists") || artists.length === 0)
    redirect(`/manage/labels/${labelId}/music`);
  return (
    <BackofficePage
      eyebrow="Label music"
      title="New release"
      description="Choose an artist, then use the same release workflow used everywhere in Nemufy."
    >
      <ReleaseForm
        artists={artists.map(({ artist }) => ({
          id: artist.id,
          name: artist.displayName || artist.name,
        }))}
      />
    </BackofficePage>
  );
}
