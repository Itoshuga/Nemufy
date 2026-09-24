import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/firebase/auth/server";

export default async function ManageAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireActiveUser();
  if (!user.claims.admin) redirect("/manage");
  return children;
}
