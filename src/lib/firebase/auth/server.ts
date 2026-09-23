import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export type SessionUser = Pick<
  DecodedIdToken,
  "uid" | "email" | "email_verified" | "name" | "picture"
>;

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
