import "server-only";

import { getArtistsForLabel } from "@/lib/firebase/firestore/repositories/label-artists";
import { getArtistsForUser } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getLabelsForUser } from "@/lib/firebase/firestore/repositories/label-memberships";
import type { StudioContext } from "@/types/platform";

export async function getStudioContexts(userId: string) {
  const [directArtists, labels] = await Promise.all([
    getArtistsForUser(userId),
    getLabelsForUser(userId),
  ]);
  const labelArtists = await Promise.all(
    labels.map(async ({ label, membership }) => ({
      membership,
      artists: await getArtistsForLabel(label.id),
    })),
  );

  const contexts: StudioContext[] = directArtists.map(
    ({ artist, membership }) => ({
      type: "artist",
      id: artist.id,
      name: artist.displayName || artist.name,
      imageUrl: artist.avatarUrl,
      role: membership.role,
    }),
  );
  const directArtistIds = new Set(directArtists.map(({ artist }) => artist.id));
  for (const { artists } of labelArtists) {
    for (const { artist } of artists) {
      if (directArtistIds.has(artist.id)) continue;
      directArtistIds.add(artist.id);
      contexts.push({
        type: "artist",
        id: artist.id,
        name: artist.displayName || artist.name,
        imageUrl: artist.avatarUrl,
        role: "label",
      });
    }
  }
  contexts.push(
    ...labels.map(({ label, membership }): StudioContext => ({
      type: "label",
      id: label.id,
      name: label.name,
      imageUrl: label.logoUrl,
      role: membership.role,
    })),
  );
  return contexts;
}
