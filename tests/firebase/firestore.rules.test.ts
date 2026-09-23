import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

const projectId = "nemufy-rules-test";
let testEnvironment: RulesTestEnvironment;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, "tracks/track-public"), {
      title: "Quiet Track",
      status: "published",
    });
    await setDoc(doc(firestore, "users/alice"), {
      uid: "alice",
      accountStatus: "active",
    });
  });
});

after(async () => {
  await testEnvironment.cleanup();
});

const verifiedContext = (uid: string) =>
  testEnvironment.authenticatedContext(uid, {
    email: `${uid}@example.com`,
    email_verified: true,
  });

describe("catalog security", () => {
  test("anonymous and unverified users cannot read published tracks", async () => {
    const anonymousFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();
    const unverifiedFirestore = testEnvironment
      .authenticatedContext("alice", {
        email: "alice@example.com",
        email_verified: false,
      })
      .firestore();

    await assertFails(getDoc(doc(anonymousFirestore, "tracks/track-public")));
    await assertFails(getDoc(doc(unverifiedFirestore, "tracks/track-public")));
  });

  test("verified users can read published tracks", async () => {
    const firestore = verifiedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(firestore, "tracks/track-public")));
  });

  test("only admins can write catalog documents", async () => {
    const listenerFirestore = verifiedContext("alice").firestore();
    const adminFirestore = testEnvironment
      .authenticatedContext("admin", {
        email_verified: true,
        admin: true,
      })
      .firestore();

    await assertFails(
      setDoc(doc(listenerFirestore, "tracks/track-new"), {
        title: "Not allowed",
        status: "published",
      }),
    );
    await assertSucceeds(
      setDoc(doc(adminFirestore, "tracks/track-new"), {
        title: "Admin track",
        status: "published",
      }),
    );
  });
});

describe("user data security", () => {
  test("a user can read only their own profile", async () => {
    const aliceFirestore = verifiedContext("alice").firestore();
    const bobFirestore = verifiedContext("bob").firestore();

    await assertSucceeds(getDoc(doc(aliceFirestore, "users/alice")));
    await assertFails(getDoc(doc(bobFirestore, "users/alice")));
  });

  test("profile and username writes remain server-only", async () => {
    const firestore = verifiedContext("alice").firestore();

    await assertFails(
      setDoc(doc(firestore, "users/alice"), { displayName: "Changed" }),
    );
    await assertFails(
      setDoc(doc(firestore, "usernames/alice"), {
        uid: "alice",
        createdAt: Timestamp.now(),
      }),
    );
  });

  test("a user can manage only their own valid liked tracks", async () => {
    const aliceFirestore = verifiedContext("alice").firestore();
    const bobFirestore = verifiedContext("bob").firestore();
    const like = { trackId: "track-public", likedAt: Timestamp.now() };

    await assertSucceeds(
      setDoc(doc(aliceFirestore, "users/alice/likedTracks/track-public"), like),
    );
    await assertFails(
      setDoc(doc(bobFirestore, "users/alice/likedTracks/track-public"), like),
    );
    await assertFails(
      setDoc(doc(aliceFirestore, "users/alice/likedTracks/track-public"), {
        ...like,
        unexpected: true,
      }),
    );
  });
});
