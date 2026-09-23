import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getPostAuthDestination } from "@/lib/firebase/auth/destination";
import { getCurrentUser } from "@/lib/firebase/auth/server";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(await getPostAuthDestination(user));

  return (
    <AuthCard
      mode="register"
      eyebrow="Create your account"
      title="Make space for rest"
      description="Your library, listening history and future playlists will stay connected to this account."
    >
      <RegisterForm />
    </AuthCard>
  );
}
