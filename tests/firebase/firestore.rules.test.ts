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
    await setDoc(doc(firestore, "artistMemberships/alice_artist-a"), {
      userId: "alice",
      artistId: "artist-a",
      role: "owner",
      status: "active",
    });
    await setDoc(doc(firestore, "artistMemberships/bob_artist-a"), {
      userId: "bob",
      artistId: "artist-a",
      role: "editor",
      status: "active",
    });
    await setDoc(doc(firestore, "auditLogs/log-1"), {
      actorUserId: "admin",
      action: "role.grant",
      targetType: "user",
      targetId: "alice",
      context: {},
      createdAt: Timestamp.now(),
    });
    await setDoc(doc(firestore, "applications/application-alice"), {
      type: "artist_claim",
      applicantUserId: "alice",
      artistId: "artist-a",
      status: "pending",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await setDoc(
      doc(firestore, "applications/application-alice/messages/message-admin"),
      {
        authorType: "admin",
        authorUserId: "admin",
        message: "Please add another public link.",
        createdAt: Timestamp.now(),
      },
    );
    await setDoc(doc(firestore, "artistOwnerships/artist-a"), {
      artistId: "artist-a",
      ownerUserId: "alice",
      ownerMembershipId: "alice_artist-a",
      claimApplicationId: "application-alice",
      claimedAt: Timestamp.now(),
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

  test("catalog writes remain server-only, even for admin clients", async () => {
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
    await assertFails(
      setDoc(doc(adminFirestore, "tracks/track-new"), {
        title: "Admin track",
        status: "published",
      }),
    );
  });

  test("only admins can read immutable audit logs", async () => {
    const listenerFirestore = verifiedContext("alice").firestore();
    const adminFirestore = testEnvironment
      .authenticatedContext("admin", {
        email_verified: true,
        admin: true,
      })
      .firestore();

    await assertFails(getDoc(doc(listenerFirestore, "auditLogs/log-1")));
    await assertSucceeds(getDoc(doc(adminFirestore, "auditLogs/log-1")));
    await assertFails(
      setDoc(doc(adminFirestore, "auditLogs/log-2"), {
        actorUserId: "admin",
      }),
    );
  });
});

describe("membership security", () => {
  test("members can read their membership and team managers can read the team", async () => {
    const aliceFirestore = verifiedContext("alice").firestore();
    const bobFirestore = verifiedContext("bob").firestore();
    const strangerFirestore = verifiedContext("stranger").firestore();

    await assertSucceeds(
      getDoc(doc(aliceFirestore, "artistMemberships/alice_artist-a")),
    );
    await assertSucceeds(
      getDoc(doc(aliceFirestore, "artistMemberships/bob_artist-a")),
    );
    await assertSucceeds(
      getDoc(doc(bobFirestore, "artistMemberships/bob_artist-a")),
    );
    await assertFails(
      getDoc(doc(strangerFirestore, "artistMemberships/alice_artist-a")),
    );
  });

  test("membership writes remain server-only", async () => {
    const firestore = verifiedContext("alice").firestore();
    await assertFails(
      setDoc(doc(firestore, "artistMemberships/alice_artist-b"), {
        userId: "alice",
        artistId: "artist-b",
        role: "owner",
        status: "active",
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

describe("creator application security", () => {
  test("applicants can read only their own application and messages", async () => {
    const aliceFirestore = verifiedContext("alice").firestore();
    const bobFirestore = verifiedContext("bob").firestore();

    await assertSucceeds(
      getDoc(doc(aliceFirestore, "applications/application-alice")),
    );
    await assertSucceeds(
      getDoc(
        doc(
          aliceFirestore,
          "applications/application-alice/messages/message-admin",
        ),
      ),
    );
    await assertFails(
      getDoc(doc(bobFirestore, "applications/application-alice")),
    );
    await assertFails(
      getDoc(
        doc(
          bobFirestore,
          "applications/application-alice/messages/message-admin",
        ),
      ),
    );
  });

  test("application and message writes are restricted to trusted server routes", async () => {
    const aliceFirestore = verifiedContext("alice").firestore();
    const adminFirestore = testEnvironment
      .authenticatedContext("admin", {
        email_verified: true,
        admin: true,
      })
      .firestore();

    await assertFails(
      setDoc(doc(aliceFirestore, "applications/application-new"), {
        type: "artist_claim",
        applicantUserId: "alice",
        artistId: "artist-a",
        status: "approved",
      }),
    );
    await assertFails(
      setDoc(
        doc(
          aliceFirestore,
          "applications/application-alice/messages/message-user",
        ),
        { authorType: "applicant", message: "Self approval" },
      ),
    );
    await assertFails(
      setDoc(doc(adminFirestore, "applications/application-new"), {
        applicantUserId: "admin",
      }),
    );
  });

  test("artist ownership is admin-readable and never client-writable", async () => {
    const aliceFirestore = verifiedContext("alice").firestore();
    const adminFirestore = testEnvironment
      .authenticatedContext("admin", {
        email_verified: true,
        admin: true,
      })
      .firestore();

    await assertFails(getDoc(doc(aliceFirestore, "artistOwnerships/artist-a")));
    await assertSucceeds(
      getDoc(doc(adminFirestore, "artistOwnerships/artist-a")),
    );
    await assertFails(
      setDoc(doc(aliceFirestore, "artistOwnerships/artist-b"), {
        artistId: "artist-b",
        ownerUserId: "alice",
      }),
    );
    await assertFails(
      setDoc(doc(adminFirestore, "artistOwnerships/artist-b"), {
        artistId: "artist-b",
        ownerUserId: "admin",
      }),
    );
  });
});
