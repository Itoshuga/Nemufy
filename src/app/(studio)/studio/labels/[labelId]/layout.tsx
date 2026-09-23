import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getLabelById } from "@/lib/firebase/firestore/repositories/labels";
import { can } from "@/lib/permissions/can";
import { requireLabelPermission } from "@/lib/permissions/server";

export default async function LabelStudioLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ labelId: string }>;
}) {
  const { labelId } = await params;
  const { user } = await requireActiveUser();
  const [label, context] = await Promise.all([
    getLabelById(labelId),
    requireLabelPermission(
      user.uid,
      user.claims.admin,
      labelId,
      "label:view",
    ).catch(() => null),
  ]);
  if (!label || !context || !can(context, "label:view")) redirect("/studio");
  return children;
}
