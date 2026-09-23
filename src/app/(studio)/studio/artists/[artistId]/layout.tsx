import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistById } from "@/lib/firebase/firestore/repositories/artists";
import { can } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";

export default async function ArtistStudioLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const { user } = await requireActiveUser();
  const [artist, permissionContext] = await Promise.all([
    getArtistById(artistId),
    getArtistPermissionContext(user.uid, artistId, user.claims.admin),
  ]);
  if (!artist || !can(permissionContext, "artist:view")) redirect("/studio");
  return children;
}
