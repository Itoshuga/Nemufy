import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type { PlaylistDocument } from "@/types/firestore";

export type PlaylistRecord = PlaylistDocument & { id: string };

export async function listPlaylists(limit = 100) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.playlists)
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as PlaylistDocument),
      }) satisfies PlaylistRecord,
  );
}

export async function getPlaylistsForUser(uid: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.playlists)
    .where("creator.id", "==", uid)
    .get();
  return snapshot.docs.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as PlaylistDocument),
      }) satisfies PlaylistRecord,
  );
}

export async function getPlaylistById(playlistId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.playlists)
    .doc(playlistId)
    .get();
  return snapshot.exists
    ? ({
        id: snapshot.id,
        ...(snapshot.data() as PlaylistDocument),
      } satisfies PlaylistRecord)
    : null;
}
