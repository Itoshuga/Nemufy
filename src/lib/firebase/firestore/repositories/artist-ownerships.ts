import "server-only";

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type { ArtistOwnershipDocument, UserDocument } from "@/types/firestore";

export type ArtistOwnershipRecord = ArtistOwnershipDocument & { id: string };

export async function getArtistOwnership(artistId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.artistOwnerships)
    .doc(artistId)
    .get();
  return snapshot.exists
    ? ({
        id: snapshot.id,
        ...(snapshot.data() as ArtistOwnershipDocument),
      } satisfies ArtistOwnershipRecord)
    : null;
}

export async function getArtistOwnershipWithOwner(artistId: string) {
  const ownership = await getArtistOwnership(artistId);
  if (!ownership) return null;
  const [profileSnapshot, authUser] = await Promise.all([
    getFirebaseAdminFirestore()
      .collection(collections.users)
      .doc(ownership.ownerUserId)
      .get(),
    getFirebaseAdminAuth()
      .getUser(ownership.ownerUserId)
      .catch(() => null),
  ]);
  return {
    ownership,
    owner: profileSnapshot.exists
      ? ({
          uid: profileSnapshot.id,
          ...profileSnapshot.data(),
        } as UserDocument)
      : null,
    email: authUser?.email ?? null,
  };
}
