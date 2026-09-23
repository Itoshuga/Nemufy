import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getPostAuthDestination } from "@/lib/firebase/auth/destination";
import { getCurrentUser } from "@/lib/firebase/auth/server";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    const destination = await getPostAuthDestination(user);
    if (!destination.startsWith("/login")) redirect(destination);
  }

  return (
    <AuthCard
      mode="login"
      eyebrow="Welcome back"
      title="Return to your quiet"
      description="Sign in to continue listening and keep your Nemufy space private."
    >
      <LoginForm />
    </AuthCard>
  );
}
