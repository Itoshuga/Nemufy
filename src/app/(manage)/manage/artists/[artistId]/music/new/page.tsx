import { redirect } from "next/navigation";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { ReleaseForm } from "@/components/studio/release-form";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistById } from "@/lib/firebase/firestore/repositories/artists";
import { can } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ManageNewArtistReleasePage({
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
    redirect(`/manage/artists/${artistId}/music`);
  return (
    <BackofficePage
      eyebrow="Music"
      title="New release"
      description="Start with the essentials. Artwork and tracks are added immediately after the private draft is created."
    >
      <ReleaseForm
        artists={[{ id: artistId, name: artist.displayName || artist.name }]}
      />
    </BackofficePage>
  );
}
