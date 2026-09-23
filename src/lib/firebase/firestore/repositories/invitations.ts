import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type { InvitationDocument } from "@/types/firestore";

export async function getInvitations(
  type: "artist" | "label",
  targetId: string,
) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.invitations)
    .where("type", "==", type)
    .where("targetId", "==", targetId)
    .get();
  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as InvitationDocument),
  }));
}
