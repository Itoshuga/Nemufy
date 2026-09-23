import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { StudioShell } from "@/components/studio/studio-shell";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getStudioContexts } from "@/lib/studio/contexts";
import { getUserCapabilitySummary } from "@/lib/users/capabilities";

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await requireActiveUser();
  if (
    !profile.capabilities.artist &&
    !profile.capabilities.label &&
    !user.claims.admin
  ) {
    redirect("/");
  }
  const contexts = await getStudioContexts(user.uid);
  const capabilities = getUserCapabilitySummary(profile);
  return (
    <StudioShell
      contexts={contexts}
      user={{
        email: user.email ?? "",
        displayName: profile.displayName ?? user.name ?? "Nemufy member",
        username: profile.username,
        capabilities,
      }}
    >
      {children}
    </StudioShell>
  );
}
