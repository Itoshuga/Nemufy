import { redirect } from "next/navigation";

export default async function ArtistStudioPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  redirect(`/studio/artists/${artistId}/overview`);
}
