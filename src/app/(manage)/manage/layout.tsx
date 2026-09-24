import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ManageShell } from "@/components/manage/manage-shell";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getStudioContexts } from "@/lib/studio/contexts";
import { getUserCapabilitySummary } from "@/lib/users/capabilities";
import { countPendingApplications } from "@/lib/firebase/firestore/repositories/applications";

export const dynamic = "force-dynamic";

export default async function ManageLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await requireActiveUser();
  const [contexts, pendingRequestCount] = await Promise.all([
    getStudioContexts(user.uid),
    user.claims.admin ? countPendingApplications() : Promise.resolve(0),
  ]);
  if (contexts.length === 0 && !user.claims.admin) redirect("/");

  const capabilities = getUserCapabilitySummary(profile, {
    hasArtistMembership: contexts.some(
      (context) => context.type === "artist" && context.role !== "label",
    ),
    hasLabelMembership: contexts.some((context) => context.type === "label"),
    isAdmin: user.claims.admin,
  });

  return (
    <ManageShell
      contexts={contexts}
      isAdmin={user.claims.admin}
      user={{
        email: user.email ?? "",
        displayName: profile.displayName ?? user.name ?? "Nemufy member",
        username: profile.username,
        capabilities,
      }}
      pendingRequestCount={pendingRequestCount}
    >
      {children}
    </ManageShell>
  );
}
