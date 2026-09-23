import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import {
  normalizeUsername,
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validation/auth";
import type { UserDocument, UsernameDocument } from "@/types/firestore";

export class UsernameTakenError extends Error {
  constructor() {
    super("USERNAME_TAKEN");
    this.name = "UsernameTakenError";
  }
}

export async function getUserProfile(
  uid: string,
): Promise<UserDocument | null> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection(collections.users)
    .doc(uid)
    .get();

  return snapshot.exists ? (snapshot.data() as UserDocument) : null;
}

export async function ensureUserProfile(token: DecodedIdToken) {
  const firestore = getFirebaseAdminFirestore();
  const userReference = firestore.collection(collections.users).doc(token.uid);
  const now = Timestamp.now();

  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userReference);
    if (!snapshot.exists) {
      const user: UserDocument = {
        uid: token.uid,
        username: null,
        usernameNormalized: null,
        displayName: token.name ?? null,
        avatarUrl: token.picture ?? null,
        role: "listener",
        accountStatus: "active",
        onboardingCompleted: false,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        schemaVersion: 1,
      };
      transaction.create(userReference, user);
      return;
    }

    transaction.update(userReference, {
      lastLoginAt: now,
      updatedAt: now,
      ...(snapshot.get("avatarUrl")
        ? {}
        : { avatarUrl: token.picture ?? null }),
    });
  });

  return getUserProfile(token.uid);
}

export async function completeUserOnboarding(
  uid: string,
  input: OnboardingInput,
) {
  const validatedInput = onboardingSchema.parse(input);
  const usernameNormalized = normalizeUsername(validatedInput.username);
  const firestore = getFirebaseAdminFirestore();
  const userReference = firestore.collection(collections.users).doc(uid);
  const usernameReference = firestore
    .collection(collections.usernames)
    .doc(usernameNormalized);
  const now = Timestamp.now();

  const user = await firestore.runTransaction(async (transaction) => {
    const [userSnapshot, usernameSnapshot] = await Promise.all([
      transaction.get(userReference),
      transaction.get(usernameReference),
    ]);

    if (!userSnapshot.exists) {
      throw new Error("USER_PROFILE_NOT_FOUND");
    }

    const existingUser = userSnapshot.data() as UserDocument;
    if (usernameSnapshot.exists && usernameSnapshot.get("uid") !== uid) {
      throw new UsernameTakenError();
    }

    const previousUsernameReference =
      existingUser.usernameNormalized &&
      existingUser.usernameNormalized !== usernameNormalized
        ? firestore
            .collection(collections.usernames)
            .doc(existingUser.usernameNormalized)
        : null;

    const previousUsernameSnapshot = previousUsernameReference
      ? await transaction.get(previousUsernameReference)
      : null;

    const usernameReservation: UsernameDocument = { uid, createdAt: now };
    transaction.set(usernameReference, usernameReservation);

    if (
      previousUsernameReference &&
      previousUsernameSnapshot?.get("uid") === uid
    ) {
      transaction.delete(previousUsernameReference);
    }

    const updatedUser: UserDocument = {
      ...existingUser,
      username: usernameNormalized,
      usernameNormalized,
      displayName: validatedInput.displayName,
      onboardingCompleted: true,
      updatedAt: now,
    };
    transaction.set(userReference, updatedUser);
    return updatedUser;
  });

  await getFirebaseAdminAuth().updateUser(uid, {
    displayName: validatedInput.displayName,
  });

  return user;
}
