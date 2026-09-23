import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type { AuditLogDocument } from "@/types/firestore";

export type AuditLogInput = Omit<AuditLogDocument, "createdAt">;

export function createAuditLogInTransaction(
  transaction: FirebaseFirestore.Transaction,
  input: AuditLogInput,
) {
  const reference = getFirebaseAdminFirestore()
    .collection(collections.auditLogs)
    .doc();
  transaction.create(reference, { ...input, createdAt: Timestamp.now() });
  return reference.id;
}

export async function writeAuditLog(input: AuditLogInput) {
  await getFirebaseAdminFirestore()
    .collection(collections.auditLogs)
    .add({ ...input, createdAt: Timestamp.now() });
}

export async function listAuditLogs(limit = 100) {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.auditLogs)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as AuditLogDocument),
  }));
}
