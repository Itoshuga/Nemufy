import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { getPostAuthDestination } from "@/lib/firebase/auth/destination";
import { requireUser } from "@/lib/firebase/auth/server";

export const metadata: Metadata = { title: "Verify email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage() {
  const user = await requireUser();
  if (user.email_verified) redirect(await getPostAuthDestination(user));

  return (
    <AuthCard
      eyebrow="One gentle step"
      title="Verify your email"
      description="This protects your library and makes sure only you can access your listening space."
    >
      <VerifyEmailPanel email={user.email ?? "your email address"} />
    </AuthCard>
  );
}
