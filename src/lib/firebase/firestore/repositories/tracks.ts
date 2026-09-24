import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { getFirestorePage } from "@/lib/firebase/firestore/pagination";
import type { TrackDocument } from "@/types/firestore";

export type TrackRecord = TrackDocument & { id: string };

const mapTrack = (
  snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>,
) =>
  ({
    id: snapshot.id,
    ...(snapshot.data() as TrackDocument),
  }) satisfies TrackRecord;

export async function getTrackById(trackId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.tracks)
    .doc(trackId)
    .get();
  return snapshot.exists
    ? ({
        id: snapshot.id,
        ...(snapshot.data() as TrackDocument),
      } satisfies TrackRecord)
    : null;
}

export async function getTracksForArtist(artistId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.tracks)
    .where("allArtistIds", "array-contains", artistId)
    .get();
  return snapshot.docs.map(mapTrack).sort((left, right) => {
    const leftTime = left.updatedAt?.toDate?.().getTime() ?? 0;
    const rightTime = right.updatedAt?.toDate?.().getTime() ?? 0;
    return rightTime - leftTime;
  });
}

export async function getTracksForRelease(releaseId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.tracks)
    .where("releaseId", "==", releaseId)
    .get();
  return snapshot.docs
    .map(mapTrack)
    .sort((left, right) => (left.trackNumber ?? 0) - (right.trackNumber ?? 0));
}

export async function listTracks(limit = 100) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.tracks)
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(mapTrack);
}

export async function listTracksPage(cursor?: string, limit = 50) {
  const page = await getFirestorePage({
    collection: collections.tracks,
    orderBy: "updatedAt",
    cursor,
    limit,
  });
  return {
    tracks: page.documents.map(mapTrack),
    nextCursor: page.nextCursor,
  };
}
