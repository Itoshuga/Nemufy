import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { ref, uploadString } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";

let testEnvironment: RulesTestEnvironment;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    // Cross-service Storage rules resolve Firestore through the emulator's
    // configured Firebase project, so this must match .firebaserc.
    projectId: "nemufyapp",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "artistMemberships/alice_artist-a"), {
      userId: "alice",
      artistId: "artist-a",
      role: "owner",
      status: "active",
    });
    await setDoc(doc(context.firestore(), "releases/release-a"), {
      allArtistIds: ["artist-a"],
      status: "draft",
    });
    await setDoc(doc(context.firestore(), "tracks/track-existing"), {
      allArtistIds: ["artist-a"],
      releaseId: "release-a",
      status: "draft",
    });
  });
});

after(async () => {
  await testEnvironment.cleanup();
});

const verifiedStorage = (uid: string) =>
  testEnvironment.authenticatedContext(uid, { email_verified: true }).storage();

describe("storage security", () => {
  test("anonymous users cannot upload files", async () => {
    const storage = testEnvironment.unauthenticatedContext().storage();
    await assertFails(
      uploadString(
        ref(storage, "users/alice/avatars/avatar.png"),
        "image",
        "raw",
        {
          contentType: "image/png",
        },
      ),
    );
  });

  test("verified users can upload only their own image avatar", async () => {
    const aliceStorage = verifiedStorage("alice");
    const bobStorage = verifiedStorage("bob");

    await assertSucceeds(
      uploadString(
        ref(aliceStorage, "users/alice/avatars/avatar.png"),
        "image",
        "raw",
        {
          contentType: "image/png",
        },
      ),
    );
    await assertFails(
      uploadString(
        ref(bobStorage, "users/alice/avatars/other.png"),
        "image",
        "raw",
        {
          contentType: "image/png",
        },
      ),
    );
    await assertFails(
      uploadString(
        ref(aliceStorage, "users/alice/avatars/avatar.txt"),
        "text",
        "raw",
        {
          contentType: "text/plain",
        },
      ),
    );
  });

  test("artist uploads require an active membership and scoped metadata", async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const membership = await getDoc(
        doc(context.firestore(), "artistMemberships/alice_artist-a"),
      );
      if (membership.data()?.role !== "owner") {
        throw new Error("Owner membership fixture was not persisted.");
      }
    });
    const aliceStorage = verifiedStorage("alice");
    const bobStorage = verifiedStorage("bob");
    const metadata = {
      contentType: "image/png",
      customMetadata: { artistId: "artist-a" },
    };

    await assertSucceeds(
      uploadString(
        ref(aliceStorage, "artists/artist-a/avatar/avatar.png"),
        "image",
        "raw",
        metadata,
      ),
    );
    await assertFails(
      uploadString(
        ref(bobStorage, "artists/artist-a/avatar/avatar.png"),
        "image",
        "raw",
        metadata,
      ),
    );
    await assertFails(
      uploadString(
        ref(aliceStorage, "artists/artist-b/avatar/avatar.png"),
        "image",
        "raw",
        metadata,
      ),
    );
  });

  test("viewer memberships cannot upload managed media", async () => {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "artistMemberships/viewer_artist-a"),
        {
          userId: "viewer",
          artistId: "artist-a",
          role: "viewer",
          status: "active",
        },
      );
    });
    await assertFails(
      uploadString(
        ref(verifiedStorage("viewer"), "artists/artist-a/avatar/viewer.png"),
        "image",
        "raw",
        {
          contentType: "image/png",
          customMetadata: { artistId: "artist-a" },
        },
      ),
    );
  });

  test("audio uploads reject invalid MIME types", async () => {
    const aliceStorage = verifiedStorage("alice");
    await assertFails(
      uploadString(
        ref(aliceStorage, "tracks/track-a/audio/master.txt"),
        "not audio",
        "raw",
        {
          contentType: "text/plain",
          customMetadata: { artistId: "artist-a", releaseId: "release-a" },
        },
      ),
    );
  });

  test("audio uploads must reference a release owned by the managed artist", async () => {
    const aliceStorage = verifiedStorage("alice");
    await assertSucceeds(
      uploadString(
        ref(aliceStorage, "tracks/track-a/audio/master.mp3"),
        "audio",
        "raw",
        {
          contentType: "audio/mpeg",
          customMetadata: { artistId: "artist-a", releaseId: "release-a" },
        },
      ),
    );
    await assertFails(
      uploadString(
        ref(aliceStorage, "tracks/track-b/audio/master.mp3"),
        "audio",
        "raw",
        {
          contentType: "audio/mpeg",
          customMetadata: {
            artistId: "artist-a",
            releaseId: "release-other",
          },
        },
      ),
    );
  });

  test("custom track covers require access to the existing track", async () => {
    const metadata = {
      contentType: "image/webp",
      customMetadata: { artistId: "artist-a" },
    };
    await assertSucceeds(
      uploadString(
        ref(verifiedStorage("alice"), "tracks/track-existing/cover/cover.webp"),
        "image",
        "raw",
        metadata,
      ),
    );
    await assertFails(
      uploadString(
        ref(verifiedStorage("bob"), "tracks/track-existing/cover/other.webp"),
        "image",
        "raw",
        metadata,
      ),
    );
  });
});
