import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Minus } from "lucide-react";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { getArtistsForUser } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getLabelsForUser } from "@/lib/firebase/firestore/repositories/label-memberships";
import { getPlaylistsForUser } from "@/lib/firebase/firestore/repositories/playlists";
import { getUserProfile } from "@/lib/firebase/firestore/repositories/users";

export default async function ManageAdminUserPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const [profile, authUser, artists, labels, playlists] = await Promise.all([
    getUserProfile(uid),
    getFirebaseAdminAuth()
      .getUser(uid)
      .catch(() => null),
    getArtistsForUser(uid),
    getLabelsForUser(uid),
    getPlaylistsForUser(uid),
  ]);
  if (!profile) notFound();
  const isAdmin = authUser?.customClaims?.admin === true;
  return (
    <BackofficePage
      eyebrow="User"
      title={profile.displayName ?? profile.username ?? "Unnamed user"}
      description={`${profile.username ? `@${profile.username} · ` : ""}${authUser?.email ?? "No email"}`}
      action={
        <div className="flex gap-2">
          <StatusBadge status={profile.accountStatus} />
          <StatusBadge status={profile.subscriptionPlan} />
        </div>
      }
    >
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <section className="border-border bg-surface rounded-2xl border p-5">
            <h2 className="font-semibold">Account</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Detail label="Email" value={authUser?.email ?? "—"} />
              <Detail
                label="Email status"
                value={authUser?.emailVerified ? "Verified" : "Not verified"}
              />
              <Detail label="Account status" value={profile.accountStatus} />
              <Detail label="Plan" value={profile.subscriptionPlan} />
              <Detail
                label="Joined"
                value={profile.createdAt.toDate().toLocaleDateString()}
              />
              <Detail
                label="Last login"
                value={profile.lastLoginAt.toDate().toLocaleString()}
              />
            </dl>
          </section>

          <section className="border-border bg-surface rounded-2xl border p-5">
            <h2 className="font-semibold">Access</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Artist and Label access is derived from active team memberships.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <AccessRow label="User" enabled />
              <AccessRow label="Artist" enabled={artists.length > 0} />
              <AccessRow label="Label" enabled={labels.length > 0} />
              <AccessRow label="Administrator" enabled={isAdmin} />
            </div>
          </section>

          <section className="border-border bg-surface rounded-2xl border p-5">
            <h2 className="font-semibold">Artists</h2>
            <div className="mt-4 space-y-2">
              {artists.map(({ artist, membership }) => (
                <Link
                  key={artist.id}
                  href={`/manage/artists/${artist.id}`}
                  className="bg-background/50 hover:bg-background flex items-center justify-between rounded-xl p-3"
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {artist.displayName || artist.name}
                    </span>
                    <span className="text-subtle text-xs capitalize">
                      {membership.role}
                    </span>
                  </span>
                  <ChevronRight className="text-subtle size-4" />
                </Link>
              ))}
              {artists.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No artist access.
                </p>
              ) : null}
            </div>
          </section>

          <section className="border-border bg-surface rounded-2xl border p-5">
            <h2 className="font-semibold">Labels</h2>
            <div className="mt-4 space-y-2">
              {labels.map(({ label, membership }) => (
                <Link
                  key={label.id}
                  href={`/manage/labels/${label.id}`}
                  className="bg-background/50 hover:bg-background flex items-center justify-between rounded-xl p-3"
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {label.name}
                    </span>
                    <span className="text-subtle text-xs capitalize">
                      {membership.role}
                    </span>
                  </span>
                  <ChevronRight className="text-subtle size-4" />
                </Link>
              ))}
              {labels.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No label access.
                </p>
              ) : null}
            </div>
          </section>

          <section className="border-border bg-surface rounded-2xl border p-5">
            <h2 className="font-semibold">Playlists</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {playlists.length} playlist{playlists.length === 1 ? "" : "s"}
            </p>
          </section>

          <details className="border-border bg-surface rounded-2xl border p-5">
            <summary className="cursor-pointer text-sm font-semibold">
              Technical information
            </summary>
            <p className="text-subtle mt-4 text-xs break-all">
              Firebase UID: {uid}
            </p>
          </details>
        </div>
        <UserAdminActions
          uid={uid}
          capabilities={profile.capabilities}
          accountStatus={profile.accountStatus}
          subscriptionPlan={profile.subscriptionPlan}
          subscriptionStatus={profile.subscriptionStatus}
        />
      </div>
    </BackofficePage>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-subtle text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm capitalize">{value}</dd>
    </div>
  );
}

function AccessRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="border-border bg-background flex items-center justify-between rounded-xl border p-3 text-sm">
      <span>{label}</span>
      {enabled ? (
        <Check className="size-4 text-emerald-300" />
      ) : (
        <Minus className="text-subtle size-4" />
      )}
    </div>
  );
}
