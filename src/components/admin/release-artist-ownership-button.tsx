"use client";

import { LoaderCircle, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReleaseArtistOwnershipButton({
  artistId,
}: {
  artistId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function release() {
    if (
      !window.confirm(
        "Release artist ownership?\n\nThe current owner will lose ownership access and this artist will become claimable again.",
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/artists/${artistId}/ownership`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "Ownership could not be released.");
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Ownership could not be released.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={release}
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <Unlink />}
        Release ownership
      </Button>
      {error ? (
        <p className="mt-2 text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
