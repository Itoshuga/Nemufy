"use client";

import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import {
  createServerSession,
  getFirebaseAuth,
} from "@/lib/firebase/auth/client";
import { getFriendlyAuthError } from "@/lib/firebase/auth/errors";
import { loginSchema } from "@/lib/validation/auth";

type FieldErrors = { email?: string; password?: string };

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setMessage("");
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const parsedInput = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsedInput.success) {
      const fieldErrors = parsedInput.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setPending(true);
    try {
      const credential = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        parsedInput.data.email,
        parsedInput.data.password,
      );
      const destination = await createServerSession(credential.user, true);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setMessage(getFriendlyAuthError(error));
      setPending(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          id="login-email"
          name="email"
          type="email"
          label="Email"
          icon={Mail}
          autoComplete="email"
          error={errors.email}
        />
        <FormField
          id="login-password"
          name="password"
          type="password"
          label="Password"
          icon={LockKeyhole}
          autoComplete="current-password"
          error={errors.password}
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="auth-link text-xs">
            Forgot password?
          </Link>
        </div>
        {message ? (
          <p className="auth-error" role="alert">
            {message}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="auth-submit w-full"
          disabled={pending}
        >
          {pending ? <LoaderCircle className="animate-spin" /> : null}
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <AuthDivider />
      <GoogleAuthButton onError={setMessage} />
    </>
  );
}

export function AuthDivider() {
  return (
    <div className="auth-divider" aria-hidden="true">
      <span className="bg-border h-px flex-1" />
      <span>or continue with</span>
      <span className="bg-border h-px flex-1" />
    </div>
  );
}
