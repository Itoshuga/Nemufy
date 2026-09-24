import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { getFirestorePage } from "@/lib/firebase/firestore/pagination";
import type { ArtistDocument } from "@/types/firestore";

export type ArtistRecord = ArtistDocument & { id: string };

const artistStatuses = new Set<ArtistDocument["status"]>([
  "active",
  "pending",
  "suspended",
  "archived",
]);

function toArtistRecord(id: string, data: DocumentData): ArtistRecord {
  const artist = data as ArtistDocument;
  const status = artistStatuses.has(artist.status) ? artist.status : "active";
  const claimStatus =
    artist.claimStatus === "claimed" ? "claimed" : "unclaimed";

  return {
    id,
    ...artist,
    status,
    claimStatus,
  };
}

export async function getArtistById(
  artistId: string,
): Promise<ArtistRecord | null> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.artists)
    .doc(artistId)
    .get();
  return snapshot.exists ? toArtistRecord(snapshot.id, snapshot.data()!) : null;
}

export async function listArtists(limit = 100): Promise<ArtistRecord[]> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.artists)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((document) =>
    toArtistRecord(document.id, document.data()),
  );
}

export async function listArtistsPage(cursor?: string, limit = 50) {
  const page = await getFirestorePage({
    collection: collections.artists,
    orderBy: "createdAt",
    cursor,
    limit,
  });
  return {
    artists: page.documents.map((document) =>
      toArtistRecord(document.id, document.data()),
    ),
    nextCursor: page.nextCursor,
  };
}
