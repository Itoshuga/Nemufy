import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { getArtistsForUser } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getLabelsForUser } from "@/lib/firebase/firestore/repositories/label-memberships";
import type { StudioContext } from "@/types/platform";

export async function getStudioContexts(userId: string) {
  const [directArtists, labels] = await Promise.all([
    getArtistsForUser(userId),
    getLabelsForUser(userId),
  ]);

  const contexts: StudioContext[] = directArtists.map(
    ({ artist, membership }) => ({
      type: "artist",
      id: artist.id,
      name: artist.displayName || artist.name,
      imageUrl: artist.avatarUrl,
      role: membership.role,
    }),
  );
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

export async function getMembershipAccessForUsers(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)];
  const access = new Map(
    uniqueIds.map((userId) => [
      userId,
      { hasArtistMembership: false, hasLabelMembership: false },
    ]),
  );
  const firestore = getFirebaseAdminFirestore();
  for (let index = 0; index < uniqueIds.length; index += 30) {
    const chunk = uniqueIds.slice(index, index + 30);
    if (chunk.length === 0) continue;
    const [artists, labels] = await Promise.all([
      firestore
        .collection(collections.artistMemberships)
        .where("userId", "in", chunk)
        .get(),
      firestore
        .collection(collections.labelMemberships)
        .where("userId", "in", chunk)
        .get(),
    ]);
    for (const membership of artists.docs) {
      if (membership.get("status") !== "active") continue;
      const current = access.get(membership.get("userId"));
      if (current) current.hasArtistMembership = true;
    }
    for (const membership of labels.docs) {
      if (membership.get("status") !== "active") continue;
      const current = access.get(membership.get("userId"));
      if (current) current.hasLabelMembership = true;
    }
  }
  return access;
}
