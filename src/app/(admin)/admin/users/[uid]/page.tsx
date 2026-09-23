import { notFound } from "next/navigation";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import {
  ManagementPageHeader,
  StatCard,
} from "@/components/studio/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getArtistsForUser } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getLabelsForUser } from "@/lib/firebase/firestore/repositories/label-memberships";
import { getPlaylistsForUser } from "@/lib/firebase/firestore/repositories/playlists";
import { getUserProfile } from "@/lib/firebase/firestore/repositories/users";

export default async function AdminUserDetailPage({
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
  return (
    <div>
      <ManagementPageHeader
        eyebrow="User details"
        title={profile.displayName ?? profile.username ?? "Unnamed user"}
        description="Account, subscription, capabilities and managed entities. No impersonation is available."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Managed artists" value={artists.length} />
        <StatCard label="Labels" value={labels.length} />
        <StatCard label="Playlists" value={playlists.length} />
        <StatCard
          label="Last login"
          value={profile.lastLoginAt.toDate().toLocaleDateString()}
        />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="border-border bg-surface rounded-2xl border p-5">
          <div className="flex justify-between">
            <h2 className="font-semibold">Account</h2>
            <StatusBadge status={profile.accountStatus} />
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="UID" value={uid} />
            <Detail label="Email" value={authUser?.email ?? "—"} />
            <Detail
              label="Verified"
              value={authUser?.emailVerified ? "Yes" : "No"}
            />
            <Detail
              label="Username"
              value={profile.username ? `@${profile.username}` : "—"}
            />
            <Detail
              label="Created"
              value={profile.createdAt.toDate().toLocaleString()}
            />
            <Detail
              label="Subscription"
              value={`${profile.subscriptionPlan} · ${profile.subscriptionStatus}`}
            />
          </dl>
        </section>
        <UserAdminActions
          uid={uid}
          capabilities={profile.capabilities}
          accountStatus={profile.accountStatus}
          subscriptionPlan={profile.subscriptionPlan}
          subscriptionStatus={profile.subscriptionStatus}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="border-border bg-surface rounded-2xl border p-5">
          <h2 className="font-semibold">Managed artists</h2>
          <div className="mt-4 space-y-2">
            {artists.map(({ artist, membership }) => (
              <div key={artist.id} className="bg-background/50 rounded-xl p-3">
                <p className="text-sm font-medium">
                  {artist.displayName || artist.name}
                </p>
                <p className="text-subtle text-xs capitalize">
                  {membership.role}
                </p>
              </div>
            ))}
            {artists.length === 0 && (
              <p className="text-muted-foreground text-sm">None</p>
            )}
          </div>
        </section>
        <section className="border-border bg-surface rounded-2xl border p-5">
          <h2 className="font-semibold">Labels</h2>
          <div className="mt-4 space-y-2">
            {labels.map(({ label, membership }) => (
              <div key={label.id} className="bg-background/50 rounded-xl p-3">
                <p className="text-sm font-medium">{label.name}</p>
                <p className="text-subtle text-xs capitalize">
                  {membership.role}
                </p>
              </div>
            ))}
            {labels.length === 0 && (
              <p className="text-muted-foreground text-sm">None</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-subtle text-[10px] tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 break-all">{value}</dd>
    </div>
  );
}
