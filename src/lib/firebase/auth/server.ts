import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { isServiceAccountActive } from "@/lib/firebase/auth/access";
import { getUserProfile } from "@/lib/firebase/firestore/repositories/users";
import type { UserDocument } from "@/types/firestore";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export type SessionUser = Pick<
  DecodedIdToken,
  "uid" | "email" | "email_verified" | "name" | "picture"
> & {
  claims: { admin: boolean };
};

export type ActiveSession = {
  user: SessionUser;
  profile: UserDocument;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decodedToken = await getFirebaseAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      claims: {
        admin: decodedToken.admin === true,
      },
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.email_verified) redirect("/verify-email");
  return user;
}

export async function getActiveSession(): Promise<ActiveSession | null> {
  const user = await getCurrentUser();
  if (!user?.email_verified) return null;
  const profile = await getUserProfile(user.uid);
  if (!profile || !isServiceAccountActive(profile.accountStatus)) return null;
  return { user, profile };
}

export async function requireActiveUser(): Promise<ActiveSession> {
  const user = await requireVerifiedUser();
  const profile = await getUserProfile(user.uid);
  if (!profile || !isServiceAccountActive(profile.accountStatus)) {
    redirect("/login?status=unavailable");
  }
  return { user, profile };
}

export async function requireAdminUser(): Promise<ActiveSession> {
  const session = await requireActiveUser();
  if (!session.user.claims.admin) {
    if (session.profile.capabilities.admin) {
      redirect("/refresh-session?next=%2Fmanage%2Fadmin&claim=admin");
    }
    redirect("/");
  }
  return session;
}
