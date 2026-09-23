import "server-only";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type {
  LabelDocument,
  LabelMembershipDocument,
  UserDocument,
} from "@/types/firestore";

export const labelMembershipId = (userId: string, labelId: string) =>
  `${userId}_${labelId}`;

export type LabelMembershipRecord = LabelMembershipDocument & { id: string };

export async function getLabelMembership(userId: string, labelId: string) {
  const firestore = getFirebaseAdminFirestore();
  const directSnapshot = await firestore
    .collection(collections.labelMemberships)
    .doc(labelMembershipId(userId, labelId))
    .get();
  if (directSnapshot.exists) {
    return {
      id: directSnapshot.id,
      ...(directSnapshot.data() as LabelMembershipDocument),
    } satisfies LabelMembershipRecord;
  }

  const fallback = await firestore
    .collection(collections.labelMemberships)
    .where("userId", "==", userId)
    .where("labelId", "==", labelId)
    .limit(1)
    .get();
  const snapshot = fallback.docs[0];
  return snapshot
    ? ({
        id: snapshot.id,
        ...(snapshot.data() as LabelMembershipDocument),
      } satisfies LabelMembershipRecord)
    : null;
}

export async function getLabelsForUser(userId: string) {
  const firestore = getFirebaseAdminFirestore();
  const memberships = await firestore
    .collection(collections.labelMemberships)
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();
  if (memberships.empty) return [];
  const labelSnapshots = await firestore.getAll(
    ...memberships.docs.map((snapshot) =>
      firestore.collection(collections.labels).doc(snapshot.get("labelId")),
    ),
  );
  return memberships.docs.flatMap((membershipSnapshot, index) => {
    const labelSnapshot = labelSnapshots[index];
    if (!labelSnapshot.exists) return [];
    return [
      {
        membership: {
          id: membershipSnapshot.id,
          ...(membershipSnapshot.data() as LabelMembershipDocument),
        } satisfies LabelMembershipRecord,
        label: {
          id: labelSnapshot.id,
          ...(labelSnapshot.data() as LabelDocument),
        },
      },
    ];
  });
}

export async function getLabelTeam(labelId: string) {
  const firestore = getFirebaseAdminFirestore();
  const memberships = await firestore
    .collection(collections.labelMemberships)
    .where("labelId", "==", labelId)
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
      ...(membershipSnapshot.data() as LabelMembershipDocument),
    } satisfies LabelMembershipRecord,
    user: userSnapshots[index].exists
      ? ({
          uid: userSnapshots[index].id,
          ...userSnapshots[index].data(),
        } as UserDocument)
      : null,
    email: authUsers[index]?.email ?? null,
  }));
}
