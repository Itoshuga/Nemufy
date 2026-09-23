import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type {
  ArtistDocument,
  LabelArtistRelationDocument,
} from "@/types/firestore";

export const labelArtistRelationId = (labelId: string, artistId: string) =>
  `${labelId}_${artistId}`;

export type LabelArtistRelationRecord = LabelArtistRelationDocument & {
  id: string;
};

export async function getLabelArtistRelation(
  labelId: string,
  artistId: string,
) {
  const firestore = getFirebaseAdminFirestore();
  const directSnapshot = await firestore
    .collection(collections.labelArtists)
    .doc(labelArtistRelationId(labelId, artistId))
    .get();
  if (directSnapshot.exists) {
    return {
      id: directSnapshot.id,
      ...(directSnapshot.data() as LabelArtistRelationDocument),
    } satisfies LabelArtistRelationRecord;
  }
  const fallback = await firestore
    .collection(collections.labelArtists)
    .where("labelId", "==", labelId)
    .where("artistId", "==", artistId)
    .limit(1)
    .get();
  const snapshot = fallback.docs[0];
  return snapshot
    ? ({
        id: snapshot.id,
        ...(snapshot.data() as LabelArtistRelationDocument),
      } satisfies LabelArtistRelationRecord)
    : null;
}

export async function getArtistsForLabel(labelId: string) {
  const firestore = getFirebaseAdminFirestore();
  const relations = await firestore
    .collection(collections.labelArtists)
    .where("labelId", "==", labelId)
    .where("status", "==", "active")
    .get();
  if (relations.empty) return [];
  const artistSnapshots = await firestore.getAll(
    ...relations.docs.map((snapshot) =>
      firestore.collection(collections.artists).doc(snapshot.get("artistId")),
    ),
  );
  return relations.docs.flatMap((relationSnapshot, index) => {
    const artistSnapshot = artistSnapshots[index];
    if (!artistSnapshot.exists) return [];
    return [
      {
        relation: {
          id: relationSnapshot.id,
          ...(relationSnapshot.data() as LabelArtistRelationDocument),
        } satisfies LabelArtistRelationRecord,
        artist: {
          id: artistSnapshot.id,
          ...(artistSnapshot.data() as ArtistDocument),
        },
      },
    ];
  });
}

export async function getAllArtistsForLabel(labelId: string) {
  const firestore = getFirebaseAdminFirestore();
  const relations = await firestore
    .collection(collections.labelArtists)
    .where("labelId", "==", labelId)
    .get();
  if (relations.empty) return [];
  const artistSnapshots = await firestore.getAll(
    ...relations.docs.map((snapshot) =>
      firestore.collection(collections.artists).doc(snapshot.get("artistId")),
    ),
  );
  return relations.docs.flatMap((relationSnapshot, index) => {
    const artistSnapshot = artistSnapshots[index];
    if (!artistSnapshot.exists) return [];
    return [
      {
        relation: {
          id: relationSnapshot.id,
          ...(relationSnapshot.data() as LabelArtistRelationDocument),
        } satisfies LabelArtistRelationRecord,
        artist: {
          id: artistSnapshot.id,
          ...(artistSnapshot.data() as ArtistDocument),
        },
      },
    ];
  });
}

export async function getActiveLabelRelationsForArtist(artistId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.labelArtists)
    .where("artistId", "==", artistId)
    .where("status", "==", "active")
    .get();
  return snapshot.docs.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as LabelArtistRelationDocument),
      }) satisfies LabelArtistRelationRecord,
  );
}

export async function getLabelRelationsForArtist(artistId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.labelArtists)
    .where("artistId", "==", artistId)
    .get();
  return snapshot.docs.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as LabelArtistRelationDocument),
      }) satisfies LabelArtistRelationRecord,
  );
}
