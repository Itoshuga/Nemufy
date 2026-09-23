import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type { ArtistDocument } from "@/types/firestore";

export type ArtistRecord = ArtistDocument & { id: string };

export async function getArtistById(
  artistId: string,
): Promise<ArtistRecord | null> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.artists)
    .doc(artistId)
    .get();
  return snapshot.exists
    ? ({
        id: snapshot.id,
        ...(snapshot.data() as ArtistDocument),
      } satisfies ArtistRecord)
    : null;
}

export async function listArtists(limit = 100): Promise<ArtistRecord[]> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.artists)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as ArtistDocument),
      }) satisfies ArtistRecord,
  );
}
