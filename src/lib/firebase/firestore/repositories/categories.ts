import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type { CategoryDocument } from "@/types/firestore";

export async function listCategories(limit = 100) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.categories)
    .limit(limit)
    .get();
  return snapshot.docs
    .map((document) => ({
      id: document.id,
      ...(document.data() as CategoryDocument),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
