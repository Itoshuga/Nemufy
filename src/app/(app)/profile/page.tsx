import Link from "next/link";
import { Building2, Disc3, Shield, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistsForUser } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getLabelsForUser } from "@/lib/firebase/firestore/repositories/label-memberships";
import { getUserCapabilitySummary } from "@/lib/users/capabilities";

export default async function ProfilePage() {
  const { user, profile } = await requireActiveUser();
  const [artists, labels] = await Promise.all([
    getArtistsForUser(user.uid),
    getLabelsForUser(user.uid),
  ]);
  const capabilities = getUserCapabilitySummary(profile);

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <header className="border-border bg-surface rounded-3xl border p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="bg-primary/15 text-primary grid size-16 shrink-0 place-items-center rounded-2xl">
            <UserRound className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="text-subtle text-xs font-semibold tracking-[.16em] uppercase">
              Nemufy account
            </p>
            <h1 className="mt-1 truncate text-3xl font-semibold">
              {profile.displayName ?? user.name ?? "Listener"}
            </h1>
            <p className="text-muted-foreground mt-1 truncate text-sm">
              {profile.username ? `@${profile.username}` : user.email}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge>User</Badge>
          {capabilities.isPremium && <Badge>Premium</Badge>}
          {capabilities.isArtist && <Badge>Artist</Badge>}
          {capabilities.isLabelMember && <Badge>Label</Badge>}
          {capabilities.isAdmin && (
            <Badge className="border-rose-400/30 text-rose-200">Admin</Badge>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="border-border bg-surface rounded-2xl border p-6">
          <h2 className="font-semibold">Account</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <ProfileField label="Email" value={user.email ?? "Not available"} />
            <ProfileField label="Firebase UID" value={user.uid} mono />
            <ProfileField label="Status" value={profile.accountStatus} />
            <ProfileField
              label="Subscription"
              value={`${profile.subscriptionPlan} · ${profile.subscriptionStatus}`}
            />
          </dl>
        </section>

        <section className="border-border bg-surface rounded-2xl border p-6">
          <h2 className="font-semibold">Workspaces</h2>
          <div className="mt-5 space-y-2">
            {artists.map(({ artist, membership }) => (
              <Link
                key={artist.id}
                href={`/studio/artists/${artist.id}`}
                className="bg-background hover:bg-surface-hover flex items-center justify-between rounded-xl p-3"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Disc3 className="text-primary size-4" />
                  {artist.displayName || artist.name}
                </span>
                <Badge>{membership.role}</Badge>
              </Link>
            ))}
            {labels.map(({ label, membership }) => (
              <Link
                key={label.id}
                href={`/studio/labels/${label.id}`}
                className="bg-background hover:bg-surface-hover flex items-center justify-between rounded-xl p-3"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Building2 className="text-primary size-4" />
                  {label.name}
                </span>
                <Badge>{membership.role}</Badge>
              </Link>
            ))}
            {artists.length === 0 && labels.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No artist or label workspace is attached to this account.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {(capabilities.isArtist || capabilities.isLabelMember) && (
          <Link
            href="/studio"
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            <Sparkles className="size-4" /> Open Studio
          </Link>
        )}
        {capabilities.isAdmin && (
          <Link
            href="/admin"
            className="border-border bg-surface inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold"
          >
            <Shield className="size-4" /> Admin Panel
          </Link>
        )}
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-subtle text-xs uppercase">{label}</dt>
      <dd className={`mt-1 break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
