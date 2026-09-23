"use client";

import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, Check, LoaderCircle, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/auth/client";
import { emailSchema } from "@/lib/validation/auth";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    const email = emailSchema.safeParse(
      new FormData(event.currentTarget).get("email"),
    );
    if (!email.success) {
      setError(
        email.error.issues[0]?.message ?? "Enter a valid email address.",
      );
      return;
    }

    setPending(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.data, {
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/login`,
      });
    } catch {
      // The confirmation remains intentionally neutral to avoid account enumeration.
    }
    setSent(true);
    setPending(false);
  };

  if (sent) {
    return (
      <div className="text-center">
        <span className="bg-primary/15 text-primary mx-auto grid size-12 place-items-center rounded-2xl">
          <Check className="size-5" />
        </span>
        <h3 className="mt-5 text-lg font-semibold">Check your inbox</h3>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          If an account matches that address, a password reset link is on its
          way.
        </p>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/login">
            <ArrowLeft />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormField
        id="reset-email"
        name="email"
        type="email"
        label="Email"
        icon={Mail}
        autoComplete="email"
        error={error}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : null}
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <Link
        href="/login"
        className="auth-link flex items-center justify-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </form>
  );
}
