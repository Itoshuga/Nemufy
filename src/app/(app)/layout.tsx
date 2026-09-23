import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireVerifiedUser } from "@/lib/firebase/auth/server";
import { getUserProfile } from "@/lib/firebase/firestore/repositories/users";
import { getUserCapabilitySummary } from "@/lib/users/capabilities";

export const dynamic = "force-dynamic";

export default async function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const sessionUser = await requireVerifiedUser();
  const profile = await getUserProfile(sessionUser.uid);

  if (!profile || !profile.onboardingCompleted) redirect("/onboarding");
  if (profile.accountStatus !== "active") redirect("/login?status=unavailable");
  const capabilities = getUserCapabilitySummary(profile);

  return (
    <AppShell
      user={{
        email: sessionUser.email ?? "",
        displayName:
          profile.displayName ?? sessionUser.name ?? "Night listener",
        username: profile.username,
        capabilities,
      }}
    >
      {children}
    </AppShell>
  );
}
