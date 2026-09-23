"use client";

import { AtSign, LoaderCircle, Sparkles, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { onboardingSchema } from "@/lib/validation/auth";

type FieldErrors = { displayName?: string; username?: string };

export function OnboardingForm({
  defaultDisplayName = "",
}: {
  defaultDisplayName?: string;
}) {
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
    const parsedInput = onboardingSchema.safeParse({
      displayName: formData.get("displayName"),
      username: formData.get("username"),
    });
    if (!parsedInput.success) {
      const fieldErrors = parsedInput.error.flatten().fieldErrors;
      setErrors({
        displayName: fieldErrors.displayName?.[0],
        username: fieldErrors.username?.[0],
      });
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedInput.data),
      });
      const payload = (await response.json()) as {
        destination?: string;
        message?: string;
        fieldErrors?: { username?: string[]; displayName?: string[] };
      };
      if (!response.ok || !payload.destination) {
        setErrors({
          username: payload.fieldErrors?.username?.[0],
          displayName: payload.fieldErrors?.displayName?.[0],
        });
        setMessage(payload.message ?? "Your profile could not be saved.");
        setPending(false);
        return;
      }
      router.replace(payload.destination);
      router.refresh();
    } catch {
      setMessage("Your profile could not be saved. Please try again.");
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="bg-surface-hover mx-auto mb-6 grid size-20 place-items-center rounded-full border border-white/10">
        <Sparkles className="text-primary size-6" />
      </div>
      <FormField
        id="display-name"
        name="displayName"
        label="Display name"
        icon={UserRound}
        defaultValue={defaultDisplayName}
        autoComplete="name"
        error={errors.displayName}
      />
      <FormField
        id="username"
        name="username"
        label="Username"
        icon={AtSign}
        autoComplete="username"
        error={errors.username}
        hint="3–24 characters: letters, numbers, underscores or dots."
      />
      <p className="text-subtle flex items-start gap-2 text-xs leading-5">
        <AtSign className="mt-0.5 size-3.5 shrink-0" />
        Your username is unique and can be changed later through a secure
        reservation.
      </p>
      {message ? (
        <p className="auth-error" role="alert">
          {message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : null}
        {pending ? "Saving profile…" : "Enter Nemufy"}
      </Button>
    </form>
  );
}
