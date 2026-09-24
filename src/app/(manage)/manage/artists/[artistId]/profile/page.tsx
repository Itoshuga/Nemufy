import { BackofficePage } from "@/components/manage/backoffice-page";
import { ArtistProfileForm } from "@/components/studio/artist-profile-form";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistById } from "@/lib/firebase/firestore/repositories/artists";
import { can, getLabelIdForArtistAction } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ManageArtistProfilePage({
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
  if (!artist) return null;
  const editable = can(context, "artist:edit");
  return (
    <BackofficePage
      eyebrow="Artist"
      title="Profile"
      description="Everything listeners see about this artist, with a live visual preview."
    >
      {editable ? (
        <ArtistProfileForm
          artistId={artistId}
          labelId={getLabelIdForArtistAction(context, "artist:edit")}
          value={{
            name: artist.name,
            displayName: artist.displayName,
            biography: artist.bio,
            categoryIds: artist.categoryIds,
            links: artist.links,
            avatarUrl: artist.avatarUrl,
            avatarStoragePath: artist.avatarStoragePath ?? null,
            bannerUrl: artist.bannerUrl,
            bannerStoragePath: artist.bannerStoragePath ?? null,
          }}
        />
      ) : (
        <p className="border-border bg-surface mt-8 rounded-2xl border p-6 text-sm text-amber-200">
          Your team role can view this profile but cannot edit it.
        </p>
      )}
    </BackofficePage>
  );
}
