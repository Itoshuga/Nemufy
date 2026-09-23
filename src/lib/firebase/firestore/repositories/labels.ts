import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type { LabelDocument } from "@/types/firestore";

export type LabelRecord = LabelDocument & { id: string };

export async function getLabelById(
  labelId: string,
): Promise<LabelRecord | null> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.labels)
    .doc(labelId)
    .get();
  return snapshot.exists
    ? ({
        id: snapshot.id,
        ...(snapshot.data() as LabelDocument),
      } satisfies LabelRecord)
    : null;
}

export async function listLabels(limit = 100): Promise<LabelRecord[]> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.labels)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as LabelDocument),
      }) satisfies LabelRecord,
  );
}
