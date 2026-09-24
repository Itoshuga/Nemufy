import { existsSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.loadEnvFile?.(existsSync(".env.local") ? ".env.local" : ".env");

const apply = process.argv.includes("--apply");
const requiredEnvironment = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
] as const;

for (const key of requiredEnvironment) {
  if (!process.env[key]) throw new Error(`Missing ${key}.`);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID as string;
const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    projectId,
  });
const firestore = getFirestore(app);

async function main() {
  const [artists, memberships, ownerships] = await Promise.all([
    firestore.collection("artists").get(),
    firestore
      .collection("artistMemberships")
      .where("role", "==", "owner")
      .where("status", "==", "active")
      .get(),
    firestore.collection("artistOwnerships").get(),
  ]);
  const existingOwnerships = new Set(
    ownerships.docs.map((document) => document.id),
  );
  const ownersByArtist = new Map<string, typeof memberships.docs>();
  for (const membership of memberships.docs) {
    const artistId = membership.get("artistId") as string;
    ownersByArtist.set(artistId, [
      ...(ownersByArtist.get(artistId) ?? []),
      membership,
    ]);
  }

  const candidates = artists.docs.flatMap((artist) => {
    if (existingOwnerships.has(artist.id)) return [];
    const owners = ownersByArtist.get(artist.id) ?? [];
    return owners.length === 1 ? [{ artist, membership: owners[0] }] : [];
  });
  const claimedArtistIds = new Set([
    ...existingOwnerships,
    ...candidates.map(({ artist }) => artist.id),
  ]);
  const artistUpdates = artists.docs.filter((artist) => {
    const expected = claimedArtistIds.has(artist.id) ? "claimed" : "unclaimed";
    return artist.get("claimStatus") !== expected;
  });
  const ambiguous = artists.docs.filter(
    (artist) =>
      !existingOwnerships.has(artist.id) &&
      (ownersByArtist.get(artist.id)?.length ?? 0) > 1,
  );

  console.log(apply ? "APPLY migration" : "DRY RUN (use --apply to write)");
  console.log("Firebase project:", projectId);
  console.log("Ownerships to create:", candidates.length);
  console.log("Artist claimStatus updates:", artistUpdates.length);
  console.log("Ambiguous artists skipped:", ambiguous.length);
  for (const artist of ambiguous) {
    console.log(" -", artist.id, artist.get("name") ?? "Unnamed artist");
  }
  if (!apply) return;

  const now = Timestamp.now();
  const operations = [
    ...candidates.map(({ artist, membership }) => ({
      kind: "ownership" as const,
      artist,
      membership,
    })),
    ...artistUpdates.map((artist) => ({ kind: "artist" as const, artist })),
  ];
  for (let offset = 0; offset < operations.length; offset += 350) {
    const batch = firestore.batch();
    for (const operation of operations.slice(offset, offset + 350)) {
      if (operation.kind === "ownership") {
        batch.create(
          firestore.collection("artistOwnerships").doc(operation.artist.id),
          {
            artistId: operation.artist.id,
            ownerUserId: operation.membership.get("userId"),
            ownerMembershipId: operation.membership.id,
            claimApplicationId: null,
            claimedAt: operation.membership.get("createdAt") ?? now,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
          },
        );
      } else {
        batch.update(operation.artist.ref, {
          claimStatus: claimedArtistIds.has(operation.artist.id)
            ? "claimed"
            : "unclaimed",
          updatedAt: now,
        });
      }
    }
    await batch.commit();
  }
  console.log("Migration complete.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
