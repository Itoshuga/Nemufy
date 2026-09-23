"use client";

import { reload, sendEmailVerification, signOut } from "firebase/auth";
import { CheckCircle2, LoaderCircle, LogOut, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  clearServerSession,
  createServerSession,
  getFirebaseAuth,
} from "@/lib/firebase/auth/client";
import { getFriendlyAuthError } from "@/lib/firebase/auth/errors";

export function VerifyEmailPanel({ email }: { email: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [pendingAction, setPendingAction] = useState<
    "check" | "resend" | "signout" | null
  >(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const checkVerification = async () => {
    if (!user) {
      setMessage("Sign in again before checking your verification status.");
      return;
    }
    setPendingAction("check");
    setMessage("");
    setSuccess("");
    try {
      await reload(user);
      if (!user.emailVerified) {
        setMessage(
          "Your email is not verified yet. Open the link in your inbox first.",
        );
        return;
      }
      const destination = await createServerSession(user, true);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setMessage(getFriendlyAuthError(error));
    } finally {
      setPendingAction(null);
    }
  };

  const resendVerification = async () => {
    if (!user) {
      setMessage("Sign in again to resend the verification email.");
      return;
    }
    setPendingAction("resend");
    setMessage("");
    setSuccess("");
    try {
      await sendEmailVerification(user);
      setSuccess("A new verification email has been sent.");
    } catch (error) {
      setMessage(getFriendlyAuthError(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSignOut = async () => {
    setPendingAction("signout");
    await Promise.all([signOut(getFirebaseAuth()), clearServerSession()]);
    router.replace("/login");
    router.refresh();
  };

  return (
    <div>
      <span className="bg-primary/15 text-primary mb-5 grid size-12 place-items-center rounded-2xl">
        <Mail className="size-5" />
      </span>
      <p className="text-muted-foreground text-sm leading-6">
        We sent a verification link to{" "}
        <strong className="text-foreground">{email}</strong>. Open it, then
        return here to continue.
      </p>
      {message ? (
        <p className="auth-error mt-5" role="alert">
          {message}
        </p>
      ) : null}
      {success ? (
        <p className="auth-success mt-5" role="status">
          <CheckCircle2 className="size-4" />
          {success}
        </p>
      ) : null}
      <div className="mt-6 space-y-3">
        <Button
          className="w-full"
          onClick={checkVerification}
          disabled={loading || pendingAction !== null}
        >
          {pendingAction === "check" ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <CheckCircle2 />
          )}
          I&apos;ve verified my email
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={resendVerification}
          disabled={loading || pendingAction !== null}
        >
          {pendingAction === "resend" ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Mail />
          )}
          Resend verification email
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={handleSignOut}
          disabled={pendingAction !== null}
        >
          <LogOut />
          Sign out
        </Button>
      </div>
    </div>
  );
}
