"use client";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { AuthDivider } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import {
  createServerSession,
  getFirebaseAuth,
} from "@/lib/firebase/auth/client";
import { getFriendlyAuthError } from "@/lib/firebase/auth/errors";
import { registerSchema } from "@/lib/validation/auth";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function RegisterForm() {
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
    const parsedInput = registerSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsedInput.success) {
      const fieldErrors = parsedInput.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      });
      return;
    }

    setPending(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        parsedInput.data.email,
        parsedInput.data.password,
      );
      await sendEmailVerification(credential.user);
      await createServerSession(credential.user, true);
      router.replace("/verify-email");
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
          id="register-email"
          name="email"
          type="email"
          label="Email"
          icon={Mail}
          autoComplete="email"
          error={errors.email}
        />
        <FormField
          id="register-password"
          name="password"
          type="password"
          label="Password"
          icon={LockKeyhole}
          autoComplete="new-password"
          error={errors.password}
          hint="10+ characters with uppercase, lowercase and a number."
        />
        <FormField
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          label="Confirm password"
          icon={LockKeyhole}
          autoComplete="new-password"
          error={errors.confirmPassword}
        />
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
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <AuthDivider />
      <GoogleAuthButton onError={setMessage} />
      <p className="auth-legal-copy">
        By creating an account, you agree to keep Nemufy a calm and respectful
        space.
      </p>
    </>
  );
}
