import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getPostAuthDestination } from "@/lib/firebase/auth/destination";
import { getCurrentUser } from "@/lib/firebase/auth/server";

export const metadata: Metadata = { title: "Reset password" };
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect(await getPostAuthDestination(user));

  return (
    <AuthCard
      eyebrow="Account recovery"
      title="Find your way back"
      description="Enter your email and we’ll send a secure password reset link if an account matches."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
