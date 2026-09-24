import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import { getFirestorePage } from "@/lib/firebase/firestore/pagination";
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

export async function listAuditLogsPage(cursor?: string, limit = 50) {
  const page = await getFirestorePage({
    collection: collections.auditLogs,
    orderBy: "createdAt",
    cursor,
    limit,
  });
  return {
    logs: page.documents.map((document) => ({
      id: document.id,
      ...(document.data() as AuditLogDocument),
    })),
    nextCursor: page.nextCursor,
  };
}

export async function getAuditLogDisplayNames(
  logs: Awaited<ReturnType<typeof listAuditLogs>>,
) {
  const firestore = getFirebaseAdminFirestore();
  const actorIds = [
    ...new Set(
      logs
        .map((log) => log.actorUserId)
        .filter((userId) => !userId.startsWith("system:")),
    ),
  ];
  const targetReferences = logs.flatMap((log) => {
    const collection = targetCollection(log.targetType);
    return collection
      ? [
          {
            key: `${log.targetType}:${log.targetId}`,
            type: log.targetType,
            reference: firestore.collection(collection).doc(log.targetId),
          },
        ]
      : [];
  });
  const uniqueTargets = [
    ...new Map(targetReferences.map((target) => [target.key, target])).values(),
  ];
  const [actorProfiles, authUsers, targetSnapshots] = await Promise.all([
    actorIds.length > 0
      ? firestore.getAll(
          ...actorIds.map((userId) =>
            firestore.collection(collections.users).doc(userId),
          ),
        )
      : [],
    actorIds.length > 0
      ? getFirebaseAdminAuth()
          .getUsers(actorIds.map((uid) => ({ uid })))
          .catch(() => ({ users: [] }))
      : { users: [] },
    uniqueTargets.length > 0
      ? firestore.getAll(...uniqueTargets.map((target) => target.reference))
      : [],
  ]);

  const actors = new Map<string, string>();
  actorIds.forEach((userId, index) => {
    const profile = actorProfiles[index]?.data();
    const authUser = authUsers.users.find((user) => user.uid === userId);
    actors.set(
      userId,
      profile?.displayName ??
        profile?.username ??
        authUser?.displayName ??
        authUser?.email ??
        "Nemufy member",
    );
  });
  for (const log of logs) {
    if (log.actorUserId.startsWith("system:")) {
      actors.set(log.actorUserId, "Nemufy system");
    }
  }

  const targets = new Map<string, string>();
  uniqueTargets.forEach((target, index) => {
    const data = targetSnapshots[index]?.data();
    if (!data) return;
    const name =
      data.displayName ??
      data.name ??
      data.title ??
      data.username ??
      data.email;
    if (typeof name === "string" && name.trim()) {
      targets.set(target.key, name);
    }
  });
  return { actors, targets };
}

function targetCollection(targetType: AuditLogDocument["targetType"]) {
  if (targetType === "user") return collections.users;
  if (targetType === "artist") return collections.artists;
  if (targetType === "label") return collections.labels;
  if (targetType === "release") return collections.releases;
  if (targetType === "track") return collections.tracks;
  if (targetType === "playlist") return collections.playlists;
  return null;
}
