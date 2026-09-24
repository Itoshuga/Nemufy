import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { getFirestorePage } from "@/lib/firebase/firestore/pagination";
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

export async function countReleasesForArtist(artistId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.releases)
    .where("allArtistIds", "array-contains", artistId)
    .count()
    .get();
  return snapshot.data().count;
}

export async function countReleasesForArtists(artistIds: string[]) {
  const uniqueIds = [...new Set(artistIds)];
  if (uniqueIds.length === 0) return 0;
  const firestore = getFirebaseAdminFirestore();
  if (uniqueIds.length <= 30) {
    const snapshot = await firestore
      .collection(collections.releases)
      .where("allArtistIds", "array-contains-any", uniqueIds)
      .count()
      .get();
    return snapshot.data().count;
  }

  // For unusually large labels, read document references only so releases
  // shared by artists in different 30-item chunks are still counted once.
  const releaseIds = new Set<string>();
  for (let index = 0; index < uniqueIds.length; index += 30) {
    const snapshot = await firestore
      .collection(collections.releases)
      .where(
        "allArtistIds",
        "array-contains-any",
        uniqueIds.slice(index, index + 30),
      )
      .select()
      .get();
    snapshot.docs.forEach((document) => releaseIds.add(document.id));
  }
  return releaseIds.size;
}

export async function listReleases(limit = 100) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.releases)
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(mapRelease);
}

export async function listReleasesPage(cursor?: string, limit = 50) {
  const page = await getFirestorePage({
    collection: collections.releases,
    orderBy: "updatedAt",
    cursor,
    limit,
  });
  return {
    releases: page.documents.map(mapRelease),
    nextCursor: page.nextCursor,
  };
}
