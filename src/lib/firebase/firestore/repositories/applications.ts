import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import {
  applicationSubcollections,
  collections,
} from "@/lib/firebase/firestore/collections";
import type {
  ApplicationDocument,
  ApplicationMessageDocument,
  ApplicationStatus,
  ApplicationType,
} from "@/types/firestore";

export type ApplicationRecord = ApplicationDocument & { id: string };
export type ApplicationMessageRecord = ApplicationMessageDocument & {
  id: string;
};

const toApplicationRecord = (
  document: FirebaseFirestore.DocumentSnapshot,
): ApplicationRecord => ({
  id: document.id,
  ...(document.data() as ApplicationDocument),
});

export async function getApplicationById(applicationId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.applications)
    .doc(applicationId)
    .get();
  return snapshot.exists ? toApplicationRecord(snapshot) : null;
}

export async function listApplicationsForUser(userId: string, limit = 50) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.applications)
    .where("applicantUserId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(Math.min(Math.max(limit, 1), 100))
    .get();
  return snapshot.docs.map(toApplicationRecord);
}

export async function listApplicationsPage({
  statuses,
  type,
  cursor,
  limit = 50,
}: {
  statuses?: ApplicationStatus[];
  type?: ApplicationType;
  cursor?: string;
  limit?: number;
}) {
  const firestore = getFirebaseAdminFirestore();
  const collection = firestore.collection(collections.applications);
  let query: FirebaseFirestore.Query = collection;
  if (statuses?.length === 1) {
    query = query.where("status", "==", statuses[0]);
  } else if (statuses && statuses.length > 1) {
    query = query.where("status", "in", statuses);
  }
  if (type) query = query.where("type", "==", type);
  query = query.orderBy("createdAt", "desc");
  if (cursor) {
    const cursorSnapshot = await collection.doc(cursor).get();
    if (cursorSnapshot.exists) query = query.startAfter(cursorSnapshot);
  }
  const pageSize = Math.min(Math.max(limit, 1), 100);
  const snapshot = await query.limit(pageSize).get();
  return {
    applications: snapshot.docs.map(toApplicationRecord),
    nextCursor:
      snapshot.size === pageSize
        ? snapshot.docs[snapshot.docs.length - 1]?.id
        : undefined,
  };
}

export async function countPendingApplications() {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.applications)
    .where("status", "in", ["pending", "under_review"])
    .count()
    .get();
  return snapshot.data().count;
}

export async function listApplicationMessages(applicationId: string) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.applications)
    .doc(applicationId)
    .collection(applicationSubcollections.messages)
    .orderBy("createdAt", "asc")
    .get();
  return snapshot.docs.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as ApplicationMessageDocument),
      }) satisfies ApplicationMessageRecord,
  );
}
