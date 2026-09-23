import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { requireVerifiedUser } from "@/lib/firebase/auth/server";
import { getUserProfile } from "@/lib/firebase/firestore/repositories/users";

export const metadata: Metadata = { title: "Set up your profile" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireVerifiedUser();
  const profile = await getUserProfile(user.uid);
  if (profile?.onboardingCompleted) redirect("/");
  if (profile && profile.accountStatus !== "active")
    redirect("/login?status=unavailable");

  return (
    <AuthCard
      eyebrow="Your Nemufy identity"
      title="How should we know you?"
      description="Choose a display name and a unique username. Artist identities remain separate from listener accounts."
    >
      <OnboardingForm
        defaultDisplayName={profile?.displayName ?? user.name ?? ""}
      />
    </AuthCard>
  );
}
