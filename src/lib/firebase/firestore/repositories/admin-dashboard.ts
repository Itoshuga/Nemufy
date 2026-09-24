import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";

export async function getAdminOverviewCounts() {
  const firestore = getFirebaseAdminFirestore();
  const [
    users,
    premiumUsers,
    artists,
    labels,
    releases,
    tracks,
    publishedTracks,
    playlists,
  ] = await Promise.all([
    firestore.collection(collections.users).count().get(),
    firestore
      .collection(collections.users)
      .where("subscriptionPlan", "==", "premium")
      .count()
      .get(),
    firestore.collection(collections.artists).count().get(),
    firestore.collection(collections.labels).count().get(),
    firestore.collection(collections.releases).count().get(),
    firestore.collection(collections.tracks).count().get(),
    firestore
      .collection(collections.tracks)
      .where("status", "==", "published")
      .count()
      .get(),
    firestore.collection(collections.playlists).count().get(),
  ]);
  return {
    users: users.data().count,
    premiumUsers: premiumUsers.data().count,
    artists: artists.data().count,
    labels: labels.data().count,
    releases: releases.data().count,
    tracks: tracks.data().count,
    publishedTracks: publishedTracks.data().count,
    playlists: playlists.data().count,
  };
}
