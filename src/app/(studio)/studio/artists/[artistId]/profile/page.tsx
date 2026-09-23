import { redirect } from "next/navigation";
import { ArtistProfileForm } from "@/components/studio/artist-profile-form";
import { ManagementPageHeader } from "@/components/studio/page-header";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistById } from "@/lib/firebase/firestore/repositories/artists";
import { can, getLabelIdForArtistAction } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ArtistProfilePage({
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
  if (!artist) redirect("/studio");
  const editable = can(context, "artist:edit");
  return (
    <div>
      <ManagementPageHeader
        eyebrow="Artist"
        title="Profile"
        description="Public identity, artwork, categories and links. Storage paths are kept with every uploaded asset."
      />
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
          Your membership can view this profile but cannot edit it.
        </p>
      )}
    </div>
  );
}
