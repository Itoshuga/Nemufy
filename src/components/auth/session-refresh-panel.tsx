"use client";

import { signOut } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import {
  clearServerSession,
  createServerSession,
  getFirebaseAuth,
} from "@/lib/firebase/auth/client";

export function SessionRefreshPanel({
  destination,
  requiredClaim,
}: {
  destination: string;
  requiredClaim: "admin" | null;
}) {
  const { user, loading } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || started.current) return;
    started.current = true;

    async function refresh() {
      if (!user) {
        await clearServerSession();
        window.location.replace("/login");
        return;
      }

      try {
        const token = await user.getIdTokenResult(true);
        if (requiredClaim === "admin" && token.claims.admin !== true) {
          throw new Error(
            "Firebase has not returned the administrator claim yet. Sign out, then sign in again.",
          );
        }
        await createServerSession(user, true);
        window.location.replace(destination);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "The secure session could not be refreshed.",
        );
      }
    }

    void refresh();
  }, [destination, loading, requiredClaim, user]);

  async function restartAuthentication() {
    await Promise.allSettled([
      signOut(getFirebaseAuth()),
      clearServerSession(),
    ]);
    window.location.replace("/login");
  }

  return (
    <main
      id="main-content"
      className="grid min-h-dvh place-items-center bg-[#090b13] p-6 text-white"
    >
      <section className="border-border bg-surface w-full max-w-md rounded-3xl border p-8 text-center shadow-2xl">
        <span className="bg-primary/15 text-primary mx-auto grid size-12 place-items-center rounded-2xl">
          {error ? (
            <RefreshCcw className="size-5" />
          ) : (
            <LoaderCircle className="size-5 animate-spin" />
          )}
        </span>
        <h1 className="mt-5 text-xl font-semibold">Refreshing access</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Nemufy is renewing your Firebase token and secure server session.
        </p>
        {error && (
          <div className="mt-6">
            <p className="text-sm text-rose-300" role="alert">
              {error}
            </p>
            <Button className="mt-5" onClick={restartAuthentication}>
              <RefreshCcw /> Sign out and sign in again
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
