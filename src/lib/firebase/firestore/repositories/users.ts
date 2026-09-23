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
import { emptyUserCapabilities, type UserCapabilities } from "@/types/platform";

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

  return snapshot.exists ? normalizeUserDocument(snapshot.data(), uid) : null;
}

function normalizeUserDocument(
  value: FirebaseFirestore.DocumentData | undefined,
  uid: string,
): UserDocument {
  const data = value as Partial<UserDocument> | undefined;
  const legacyCapabilities: UserCapabilities = {
    artist: data?.role === "artist",
    label: false,
    admin: data?.role === "admin",
  };
  const capabilities: UserCapabilities = {
    artist: data?.capabilities?.artist ?? legacyCapabilities.artist,
    label: data?.capabilities?.label ?? legacyCapabilities.label,
    admin: data?.capabilities?.admin ?? legacyCapabilities.admin,
  };

  return {
    ...(data as UserDocument),
    uid,
    capabilities,
    subscriptionPlan: data?.subscriptionPlan ?? "free",
    subscriptionStatus: data?.subscriptionStatus ?? "inactive",
    accountStatus: data?.accountStatus ?? "active",
  };
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
        capabilities: { ...emptyUserCapabilities },
        subscriptionPlan: "free",
        subscriptionStatus: "inactive",
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

    const existingUser = normalizeUserDocument(snapshot.data(), token.uid);
    transaction.update(userReference, {
      lastLoginAt: now,
      updatedAt: now,
      capabilities: existingUser.capabilities,
      subscriptionPlan: existingUser.subscriptionPlan,
      subscriptionStatus: existingUser.subscriptionStatus,
      accountStatus: existingUser.accountStatus,
      ...(snapshot.get("avatarUrl")
        ? {}
        : { avatarUrl: token.picture ?? null }),
    });
  });

  return getUserProfile(token.uid);
}

export type UserListItem = Pick<
  UserDocument,
  | "uid"
  | "username"
  | "displayName"
  | "avatarUrl"
  | "accountStatus"
  | "capabilities"
  | "subscriptionPlan"
  | "subscriptionStatus"
  | "createdAt"
  | "lastLoginAt"
> & { email: string | null; emailVerified: boolean };

export async function listUsers(limit = 100): Promise<UserListItem[]> {
  const firestoreSnapshot = await getFirebaseAdminFirestore()
    .collection(collections.users)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  const profiles = firestoreSnapshot.docs.map((snapshot) =>
    normalizeUserDocument(snapshot.data(), snapshot.id),
  );
  const auth = getFirebaseAdminAuth();
  const authUsers = await Promise.all(
    profiles.map((profile) => auth.getUser(profile.uid).catch(() => null)),
  );

  return profiles.map((profile, index) => ({
    uid: profile.uid,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    accountStatus: profile.accountStatus,
    capabilities: profile.capabilities,
    subscriptionPlan: profile.subscriptionPlan,
    subscriptionStatus: profile.subscriptionStatus,
    createdAt: profile.createdAt,
    lastLoginAt: profile.lastLoginAt,
    email: authUsers[index]?.email ?? null,
    emailVerified: authUsers[index]?.emailVerified ?? false,
  }));
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
