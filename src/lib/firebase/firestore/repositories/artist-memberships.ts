import "server-only";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type {
  ArtistDocument,
  ArtistMembershipDocument,
  UserDocument,
} from "@/types/firestore";

export const artistMembershipId = (userId: string, artistId: string) =>
  `${userId}_${artistId}`;

export type ArtistMembershipRecord = ArtistMembershipDocument & {
  id: string;
};

export async function getArtistMembership(userId: string, artistId: string) {
  const firestore = getFirebaseAdminFirestore();
  const directSnapshot = await firestore
    .collection(collections.artistMemberships)
    .doc(artistMembershipId(userId, artistId))
    .get();
  if (directSnapshot.exists) {
    return {
      id: directSnapshot.id,
      ...(directSnapshot.data() as ArtistMembershipDocument),
    } satisfies ArtistMembershipRecord;
  }

  const fallback = await firestore
    .collection(collections.artistMemberships)
    .where("userId", "==", userId)
    .where("artistId", "==", artistId)
    .limit(1)
    .get();
  const snapshot = fallback.docs[0];
  return snapshot
    ? ({
        id: snapshot.id,
        ...(snapshot.data() as ArtistMembershipDocument),
      } satisfies ArtistMembershipRecord)
    : null;
}

export async function getArtistsForUser(userId: string) {
  const firestore = getFirebaseAdminFirestore();
  const memberships = await firestore
    .collection(collections.artistMemberships)
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();
  if (memberships.empty) return [];

  const artistSnapshots = await firestore.getAll(
    ...memberships.docs.map((snapshot) =>
      firestore.collection(collections.artists).doc(snapshot.get("artistId")),
    ),
  );
  return memberships.docs.flatMap((membershipSnapshot, index) => {
    const artistSnapshot = artistSnapshots[index];
    if (!artistSnapshot.exists) return [];
    return [
      {
        membership: {
          id: membershipSnapshot.id,
          ...(membershipSnapshot.data() as ArtistMembershipDocument),
        } satisfies ArtistMembershipRecord,
        artist: {
          id: artistSnapshot.id,
          ...(artistSnapshot.data() as ArtistDocument),
        },
      },
    ];
  });
}

export async function getArtistTeam(artistId: string) {
  const firestore = getFirebaseAdminFirestore();
  const memberships = await firestore
    .collection(collections.artistMemberships)
    .where("artistId", "==", artistId)
    .get();
  if (memberships.empty) return [];

  const userSnapshots = await firestore.getAll(
    ...memberships.docs.map((snapshot) =>
      firestore.collection(collections.users).doc(snapshot.get("userId")),
    ),
  );
  const authUsers = await Promise.all(
    memberships.docs.map((snapshot) =>
      getFirebaseAdminAuth()
        .getUser(snapshot.get("userId"))
        .catch(() => null),
    ),
  );
  return memberships.docs.map((membershipSnapshot, index) => ({
    membership: {
      id: membershipSnapshot.id,
      ...(membershipSnapshot.data() as ArtistMembershipDocument),
    } satisfies ArtistMembershipRecord,
    user: userSnapshots[index].exists
      ? ({
          uid: userSnapshots[index].id,
          ...userSnapshots[index].data(),
        } as UserDocument)
      : null,
    email: authUsers[index]?.email ?? null,
  }));
}
