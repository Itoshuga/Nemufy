"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, MoreHorizontal, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  UserCapabilities,
} from "@/types/platform";

type UserAdminActionsProps = {
  uid: string;
  capabilities: UserCapabilities;
  accountStatus: "active" | "suspended" | "deleted";
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
};

export function UserAdminActions({
  uid,
  capabilities,
  accountStatus,
  subscriptionPlan,
  subscriptionStatus,
}: UserAdminActionsProps) {
  const router = useRouter();
  const [adminAccess, setAdminAccess] = useState(capabilities.admin);
  const [subscription, setSubscription] = useState({
    subscriptionPlan,
    subscriptionStatus,
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function post(path: string, body: object) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Account update failed.");
      }
      router.refresh();
      return true;
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "Account update failed.",
      );
      return false;
    } finally {
      setPending(false);
    }
  }

  async function saveCapabilities() {
    if (
      await post(`/api/admin/users/${uid}/permissions`, {
        capabilities: { ...capabilities, admin: adminAccess },
      })
    ) {
      setMessage(
        "Administrator access updated. The user must refresh their session.",
      );
    }
  }

  async function saveSubscription() {
    if (await post(`/api/admin/users/${uid}/subscription`, subscription)) {
      setMessage(
        "Subscription updated without coupling it to authorization roles.",
      );
    }
  }

  async function setStatus(nextStatus: "active" | "suspended") {
    if (
      await post(`/api/admin/users/${uid}/status`, {
        accountStatus: nextStatus,
      })
    ) {
      setMessage(
        nextStatus === "suspended"
          ? "Account suspended and refresh tokens revoked."
          : "Account reactivated.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <section className="border-border bg-surface rounded-2xl border p-5">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl">
            <ShieldCheck className="size-4" />
          </span>
          <h2 className="font-semibold">Administrator access</h2>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Artist and Label access comes from team memberships, not this switch.
        </p>
        <label className="border-border bg-background mt-5 flex items-center gap-3 rounded-xl border p-3 text-sm">
          <input
            type="checkbox"
            checked={adminAccess}
            onChange={(event) => setAdminAccess(event.target.checked)}
          />{" "}
          Administrator
        </label>
        <Button className="mt-5" onClick={saveCapabilities} disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />}
          Save access
        </Button>
      </section>

      <section className="border-border bg-surface rounded-2xl border p-5">
        <h2 className="font-semibold">Account plan</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Prepared manually for now; no Stripe integration is present.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <select
            value={subscription.subscriptionPlan}
            onChange={(event) =>
              setSubscription({
                ...subscription,
                subscriptionPlan: event.target.value as SubscriptionPlan,
              })
            }
            className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
          >
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
          <select
            value={subscription.subscriptionStatus}
            onChange={(event) =>
              setSubscription({
                ...subscription,
                subscriptionStatus: event.target.value as SubscriptionStatus,
              })
            }
            className="border-border bg-background rounded-xl border px-3 py-2.5 text-sm"
          >
            <option value="inactive">Inactive</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past due</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Button
          className="mt-5"
          variant="secondary"
          onClick={saveSubscription}
          disabled={pending}
        >
          Save plan
        </Button>
      </section>

      <section className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <MoreHorizontal className="size-4" /> Account actions
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Suspension is enforced by session checks and revokes Firebase refresh
          tokens.
        </p>
        <Button
          className="mt-5"
          variant={accountStatus === "suspended" ? "secondary" : "destructive"}
          onClick={() =>
            setStatus(accountStatus === "suspended" ? "active" : "suspended")
          }
          disabled={pending}
        >
          {accountStatus === "suspended"
            ? "Reactivate account"
            : "Suspend account"}
        </Button>
      </section>
      {message && (
        <p className="text-muted-foreground text-sm" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
