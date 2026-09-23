import "server-only";

import type { SessionUser } from "@/lib/firebase/auth/server";
import { getUserProfile } from "@/lib/firebase/firestore/repositories/users";

export async function getPostAuthDestination(user: SessionUser) {
  if (!user.email_verified) return "/verify-email";

  const profile = await getUserProfile(user.uid);
  if (profile && profile.accountStatus !== "active") {
    return "/login?status=unavailable";
  }
  return profile?.onboardingCompleted ? "/" : "/onboarding";
}
