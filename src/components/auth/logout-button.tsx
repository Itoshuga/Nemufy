"use client";

import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  clearServerSession,
  getFirebaseAuth,
} from "@/lib/firebase/auth/client";
import { usePlayerStore } from "@/stores/player-store";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    if (pending) return;
    setPending(true);
    usePlayerStore.getState().reset();
    await Promise.allSettled([
      signOut(getFirebaseAuth()),
      clearServerSession(),
    ]);
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={pending}
      className="w-full justify-start"
    >
      <LogOut />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
