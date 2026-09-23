import { redirect } from "next/navigation";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { ReleaseForm } from "@/components/studio/release-form";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistById } from "@/lib/firebase/firestore/repositories/artists";
import { can } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function NewReleasePage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const { user } = await requireActiveUser();
  const [artist, context] = await Promise.all([
    getArtistById(artistId),
    getArtistPermissionContext(user.uid, artistId, user.claims.admin),
  ]);
  if (!artist || !can(context, "release:create"))
    redirect(`/studio/artists/${artistId}/releases`);
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Release workflow"
        title="Create a release"
        description="Seven clear stages lead to a draft. Audio and artwork are uploaded only after the release has a stable identity."
      />
      <ReleaseForm
        artistId={artistId}
        artistName={artist.displayName || artist.name}
      />
    </div>
  );
}
