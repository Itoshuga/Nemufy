import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteApp, getApps } from "firebase-admin/app";
import { Timestamp } from "firebase-admin/firestore";

const projectId = "nemufy-application-service-test";
let testEnvironment: RulesTestEnvironment;
let firestore: FirebaseFirestore.Firestore;
let services: typeof import("../../src/lib/services/applications");

before(async () => {
  process.env.FIREBASE_ADMIN_PROJECT_ID = projectId;
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL = "emulator@example.com";
  process.env.FIREBASE_ADMIN_PRIVATE_KEY = "emulator-private-key";
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET = `${projectId}.appspot.com`;
  testEnvironment = await initializeTestEnvironment({ projectId });
  const admin = await import("../../src/lib/firebase/admin");
  firestore = admin.getFirebaseAdminFirestore();
  services = await import("../../src/lib/services/applications");
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await seedUser("applicant");
  await seedUser("other");
  await seedArtist("artist-a", "Nemu");
});

after(async () => {
  await testEnvironment.cleanup();
  await Promise.all(getApps().map((app) => deleteApp(app)));
});

describe("creator application services", () => {
  test("an unclaimed artist accepts one active claim per applicant", async () => {
    const first = await services.submitApplication(
      actor("applicant"),
      claimInput("artist-a"),
    );
    assert.ok(first.id);

    await assert.rejects(
      () =>
        services.submitApplication(actor("applicant"), claimInput("artist-a")),
      (error: unknown) => hasPlatformCode(error, "APPLICATION_CONFLICT"),
    );
  });

  test("a claimed artist cannot receive another public claim", async () => {
    await firestore.collection("artists").doc("artist-a").update({
      claimStatus: "claimed",
    });
    await firestore.collection("artistOwnerships").doc("artist-a").set({
      artistId: "artist-a",
      ownerUserId: "other",
      ownerMembershipId: "other_artist-a",
      claimApplicationId: null,
      claimedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      schemaVersion: 1,
    });

    await assert.rejects(
      () =>
        services.submitApplication(actor("applicant"), claimInput("artist-a")),
      (error: unknown) => hasPlatformCode(error, "ARTIST_ALREADY_CLAIMED"),
    );
  });

  test("approving a claim creates ownership and owner membership, then closes competing claims", async () => {
    const first = await services.submitApplication(
      actor("applicant"),
      claimInput("artist-a"),
    );
    const competing = await services.submitApplication(
      actor("other"),
      claimInput("artist-a"),
    );

    await services.reviewApplication(actor("admin", true), first.id, {
      action: "approve",
    });

    const [artist, ownership, membership, approved, rejected] =
      await Promise.all([
        firestore.collection("artists").doc("artist-a").get(),
        firestore.collection("artistOwnerships").doc("artist-a").get(),
        firestore
          .collection("artistMemberships")
          .doc("applicant_artist-a")
          .get(),
        firestore.collection("applications").doc(first.id).get(),
        firestore.collection("applications").doc(competing.id).get(),
      ]);

    assert.equal(artist.get("claimStatus"), "claimed");
    assert.equal(ownership.get("ownerUserId"), "applicant");
    assert.equal(membership.get("role"), "owner");
    assert.equal(membership.get("status"), "active");
    assert.equal(approved.get("status"), "approved");
    assert.equal(rejected.get("status"), "rejected");
    assert.equal(rejected.get("resolutionReason"), "artist_already_claimed");

    await assert.rejects(
      () =>
        services.reviewApplication(actor("admin", true), competing.id, {
          action: "approve",
        }),
      (error: unknown) => hasPlatformCode(error, "APPLICATION_CONFLICT"),
    );
  });

  test("releasing ownership revokes primary access and makes the artist claimable again", async () => {
    const application = await services.submitApplication(
      actor("applicant"),
      claimInput("artist-a"),
    );
    await services.reviewApplication(actor("admin", true), application.id, {
      action: "approve",
    });

    await services.releaseArtistOwnership(actor("admin", true), "artist-a");

    const [artist, ownership, membership] = await Promise.all([
      firestore.collection("artists").doc("artist-a").get(),
      firestore.collection("artistOwnerships").doc("artist-a").get(),
      firestore.collection("artistMemberships").doc("applicant_artist-a").get(),
    ]);
    assert.equal(artist.get("claimStatus"), "unclaimed");
    assert.equal(ownership.exists, false);
    assert.equal(membership.get("status"), "revoked");

    const replacement = await services.submitApplication(
      actor("other"),
      claimInput("artist-a"),
    );
    assert.ok(replacement.id);
  });

  test("artist creation grants nothing before approval and creates the full ownership graph after approval", async () => {
    const application = await services.submitApplication(actor("applicant"), {
      type: "artist_creation",
      name: "Airi Dreams",
      biography: "Soft spoken ASMR.",
      socialUrls: [],
      categoryIds: [],
    });
    assert.equal((await firestore.collection("artists").get()).size, 1);
    assert.equal(
      (
        await firestore
          .collection("artistMemberships")
          .where("userId", "==", "applicant")
          .get()
      ).empty,
      true,
    );

    await services.reviewApplication(actor("admin", true), application.id, {
      action: "approve",
    });
    const approvedApplication = await firestore
      .collection("applications")
      .doc(application.id)
      .get();
    const artistId = approvedApplication.get("artistId") as string;
    assert.ok(artistId);
    const [artist, ownership, membership] = await Promise.all([
      firestore.collection("artists").doc(artistId).get(),
      firestore.collection("artistOwnerships").doc(artistId).get(),
      firestore
        .collection("artistMemberships")
        .doc(`applicant_${artistId}`)
        .get(),
    ]);
    assert.equal(artist.get("claimStatus"), "claimed");
    assert.equal(ownership.get("ownerUserId"), "applicant");
    assert.equal(membership.get("role"), "owner");
  });

  test("label creation grants nothing before approval and creates an owner membership after approval", async () => {
    const application = await services.submitApplication(actor("applicant"), {
      type: "label_creation",
      name: "Moon Records",
      socialUrls: [],
      description: "Independent ASMR label.",
    });
    assert.equal((await firestore.collection("labels").get()).empty, true);

    await services.reviewApplication(actor("admin", true), application.id, {
      action: "approve",
    });
    const approvedApplication = await firestore
      .collection("applications")
      .doc(application.id)
      .get();
    const labelId = approvedApplication.get("labelId") as string;
    assert.ok(labelId);
    const membership = await firestore
      .collection("labelMemberships")
      .doc(`applicant_${labelId}`)
      .get();
    assert.equal(membership.get("role"), "owner");
    assert.equal(membership.get("status"), "active");
  });

  test("a non-admin cannot review an application", async () => {
    const application = await services.submitApplication(
      actor("applicant"),
      claimInput("artist-a"),
    );
    await assert.rejects(
      () =>
        services.reviewApplication(actor("other"), application.id, {
          action: "approve",
        }),
      (error: unknown) => hasPlatformCode(error, "FORBIDDEN"),
    );
  });
});

function actor(uid: string, admin = false) {
  return {
    user: {
      uid,
      email: `${uid}@example.com`,
      email_verified: true,
      claims: { admin },
    },
    profile: {
      uid,
      capabilities: { artist: false, label: false, admin },
      accountStatus: "active",
    },
  } as never;
}

function claimInput(artistId: string) {
  return {
    type: "artist_claim",
    artistId,
    websiteUrl: "https://example.com/artist",
    socialUrls: ["https://example.com/social"],
    contactEmail: "artist@example.com",
  };
}

async function seedUser(uid: string) {
  const now = Timestamp.now();
  await firestore
    .collection("users")
    .doc(uid)
    .set({
      uid,
      username: uid,
      usernameNormalized: uid,
      displayName: uid,
      avatarUrl: null,
      capabilities: { artist: false, label: false, admin: false },
      subscriptionPlan: "free",
      subscriptionStatus: "inactive",
      accountStatus: "active",
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      schemaVersion: 1,
    });
}

async function seedArtist(id: string, name: string) {
  const now = Timestamp.now();
  await firestore.collection("artists").doc(id).set({
    name,
    displayName: name,
    slug: name.toLowerCase(),
    avatarUrl: null,
    bannerUrl: null,
    avatarStoragePath: null,
    bannerStoragePath: null,
    bio: "",
    verified: false,
    status: "active",
    claimStatus: "unclaimed",
    monthlyListeners: 0,
    followerCount: 0,
    categoryIds: [],
    links: [],
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  });
}

function hasPlatformCode(error: unknown, code: string) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { code: string }).code === code
  );
}
