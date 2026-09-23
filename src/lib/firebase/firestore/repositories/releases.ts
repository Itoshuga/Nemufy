import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type { ReleaseDocument } from "@/types/firestore";

export type ReleaseRecord = ReleaseDocument & { id: string };

const mapRelease = (
  snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>,
) =>
  ({
    id: snapshot.id,
    ...(snapshot.data() as ReleaseDocument),
  }) satisfies ReleaseRecord;

export async function getReleaseById(releaseId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.releases)
    .doc(releaseId)
    .get();
  return snapshot.exists
    ? ({
        id: snapshot.id,
        ...(snapshot.data() as ReleaseDocument),
      } satisfies ReleaseRecord)
    : null;
}

export async function getReleasesForArtist(artistId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.releases)
    .where("allArtistIds", "array-contains", artistId)
    .get();
  return snapshot.docs.map(mapRelease).sort((left, right) => {
    const leftTime = left.updatedAt?.toDate?.().getTime() ?? 0;
    const rightTime = right.updatedAt?.toDate?.().getTime() ?? 0;
    return rightTime - leftTime;
  });
}

export async function listReleases(limit = 100) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.releases)
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(mapRelease);
}
