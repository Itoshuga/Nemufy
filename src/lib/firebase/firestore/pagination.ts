import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export async function getFirestorePage({
  collection,
  orderBy,
  cursor,
  limit = 50,
}: {
  collection: string;
  orderBy: string;
  cursor?: string;
  limit?: number;
}) {
  const firestore = getFirebaseAdminFirestore();
  const collectionReference = firestore.collection(collection);
  let query: FirebaseFirestore.Query = collectionReference.orderBy(
    orderBy,
    "desc",
  );
  if (cursor) {
    const cursorSnapshot = await collectionReference.doc(cursor).get();
    if (cursorSnapshot.exists) query = query.startAfter(cursorSnapshot);
  }
  const pageSize = Math.min(Math.max(limit, 1), 100);
  const snapshot = await query.limit(pageSize).get();
  return {
    documents: snapshot.docs,
    nextCursor:
      snapshot.size === pageSize
        ? snapshot.docs[snapshot.docs.length - 1]?.id
        : undefined,
  };
}
