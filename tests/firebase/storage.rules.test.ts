import { readFileSync } from "node:fs";
import { after, before, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { ref, uploadString } from "firebase/storage";

let testEnvironment: RulesTestEnvironment;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: "nemufy-storage-rules-test",
    storage: { rules: readFileSync("storage.rules", "utf8") },
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
});
