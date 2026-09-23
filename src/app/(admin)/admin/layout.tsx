import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/lib/firebase/auth/server";
import { getUserCapabilitySummary } from "@/lib/users/capabilities";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await requireAdminUser();
  return (
    <AdminShell
      user={{
        email: user.email ?? "",
        displayName: profile.displayName ?? user.name ?? "Administrator",
        username: profile.username,
        capabilities: getUserCapabilitySummary(profile),
      }}
    >
      {children}
    </AdminShell>
  );
}
