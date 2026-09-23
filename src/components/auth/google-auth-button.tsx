"use client";

import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createServerSession,
  getFirebaseAuth,
  googleAuthProvider,
} from "@/lib/firebase/auth/client";
import { getFriendlyAuthError } from "@/lib/firebase/auth/errors";

export function GoogleAuthButton({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleGoogleSignIn = async () => {
    if (pending) return;
    setPending(true);
    onError("");
    try {
      const credential = await signInWithPopup(
        getFirebaseAuth(),
        googleAuthProvider,
      );
      const destination = await createServerSession(credential.user, true);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      onError(getFriendlyAuthError(error));
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="auth-oauth-button w-full"
      onClick={handleGoogleSignIn}
      disabled={pending}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : <GoogleGlyph />}
      Google
    </Button>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.25-2.53a6.03 6.03 0 0 1-8.98-3.17H3.06v2.61A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.87a6.02 6.02 0 0 1 0-3.74V7.52H3.07a10 10 0 0 0 0 8.96l3.34-2.61Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.8.51 3.84 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.52l3.35 2.61A5.96 5.96 0 0 1 12 5.98Z"
      />
    </svg>
  );
}
