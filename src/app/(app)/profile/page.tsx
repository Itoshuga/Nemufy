import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Disc3,
  Headphones,
  Shield,
  Sparkles,
} from "lucide-react";
import { CoverImage } from "@/components/media/cover-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getArtistsForUser } from "@/lib/firebase/firestore/repositories/artist-memberships";
import { getLabelsForUser } from "@/lib/firebase/firestore/repositories/label-memberships";
import { getPlaylistsForUser } from "@/lib/firebase/firestore/repositories/playlists";
import { getUserCapabilitySummary } from "@/lib/users/capabilities";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile } = await requireActiveUser();
  const [artists, labels, playlists] = await Promise.all([
    getArtistsForUser(user.uid),
    getLabelsForUser(user.uid),
    getPlaylistsForUser(user.uid),
  ]);
  const capabilities = getUserCapabilitySummary(profile, {
    hasArtistMembership: artists.length > 0,
    hasLabelMembership: labels.length > 0,
    isAdmin: user.claims.admin,
  });
  const publicPlaylists = playlists.filter(
    (playlist) => playlist.visibility === "public",
  );
  const displayName = profile.displayName ?? user.name ?? "Listener";
  const profileHandle = profile.username
    ? `@${profile.username}`
    : (user.email ?? "Nemufy member");
  const workspaceCount =
    artists.length + labels.length + (capabilities.isAdmin ? 1 : 0);
  const initials = getInitials(displayName);
  const memberSince = profile.createdAt.toDate().toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page-container !pt-0">
      <header className="relative isolate overflow-hidden rounded-b-[2rem] border-x border-b border-white/10 bg-[linear-gradient(145deg,#5f538e_0%,#37334f_42%,#171824_100%)] px-5 pt-12 pb-8 shadow-[0_30px_80px_rgba(0,0,0,.22)] sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        <div
          className="pointer-events-none absolute -top-40 -right-32 -z-10 size-[34rem] rounded-full bg-violet-300/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-black/40 to-transparent"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-7 lg:flex-row lg:items-end">
          <div className="relative size-36 shrink-0 sm:size-44 lg:size-52">
            {profile.avatarUrl ? (
              <CoverImage
                src={profile.avatarUrl}
                alt={`${displayName} profile picture`}
                priority
                sizes="(max-width: 640px) 144px, (max-width: 1024px) 176px, 208px"
                className="size-full rounded-full shadow-[0_24px_70px_rgba(0,0,0,.46)] ring-1 ring-white/15"
              />
            ) : (
              <div className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.2),transparent_34%),linear-gradient(145deg,#8e7ce5,#443b78)] shadow-[0_24px_70px_rgba(0,0,0,.46)] ring-1 ring-white/15">
                <span className="font-display text-5xl font-semibold tracking-[-.08em] text-white sm:text-6xl">
                  {initials}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[.18em] text-white/70 uppercase">
              Profile
            </p>
            <h1 className="font-display mt-2 truncate text-[clamp(3rem,8vw,7rem)] leading-[.88] font-semibold tracking-[-.065em] text-white">
              {displayName}
            </h1>
            <p className="mt-4 truncate text-sm font-medium text-white/70">
              {profileHandle}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/70">
              <span>
                <strong className="font-semibold text-white">
                  {publicPlaylists.length}
                </strong>{" "}
                public {publicPlaylists.length === 1 ? "playlist" : "playlists"}
              </span>
              <span className="size-1 rounded-full bg-white/35" aria-hidden />
              <span>
                <strong className="font-semibold text-white">
                  {workspaceCount}
                </strong>{" "}
                {workspaceCount === 1 ? "workspace" : "workspaces"}
              </span>
              <span className="size-1 rounded-full bg-white/35" aria-hidden />
              <span>
                {capabilities.isPremium ? "Premium member" : "Free member"}
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {workspaceCount > 0 ? (
                <Button asChild size="lg" className="shadow-none">
                  <Link href="/manage">
                    <Sparkles aria-hidden="true" />
                    Open workspace hub
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="shadow-none">
                  <Link href="/creator">
                    <Sparkles aria-hidden="true" />
                    Become a creator
                  </Link>
                </Button>
              )}
              {capabilities.isAdmin && (
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="border-white/15 bg-black/20 text-white hover:bg-black/30"
                >
                  <Link href="/manage/admin">
                    <Shield aria-hidden="true" />
                    Administration
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-10 sm:pt-12">
        <section id="workspaces" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Creator access"
            title="Your workspaces"
            description="Jump straight into the spaces you manage on Nemufy."
            action={
              workspaceCount > 0 ? (
                <Link
                  href="/manage"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                >
                  View all <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : undefined
            }
          />

          {workspaceCount > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {artists.map(({ artist, membership }) => (
                <WorkspaceCard
                  key={artist.id}
                  href={`/manage/artists/${artist.id}`}
                  name={artist.displayName || artist.name}
                  type="Artist workspace"
                  role={membership.role}
                  imageUrl={artist.avatarUrl}
                  icon={Disc3}
                />
              ))}
              {labels.map(({ label, membership }) => (
                <WorkspaceCard
                  key={label.id}
                  href={`/manage/labels/${label.id}`}
                  name={label.name}
                  type="Label workspace"
                  role={membership.role}
                  imageUrl={label.logoUrl}
                  icon={Building2}
                />
              ))}
              {capabilities.isAdmin && (
                <WorkspaceCard
                  href="/manage/admin"
                  name="Nemufy platform"
                  type="Administration"
                  role="admin"
                  icon={Shield}
                  admin
                />
              )}
            </div>
          ) : (
            <div className="border-border bg-surface/60 mt-6 flex flex-col items-start rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">No workspace yet</p>
                <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-6">
                  Claim an artist profile or submit a creator request to start
                  managing content on Nemufy.
                </p>
              </div>
              <Button asChild variant="secondary" className="mt-5 sm:mt-0">
                <Link href="/creator">Explore creator access</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="page-section">
          <SectionHeading
            eyebrow="Your collection"
            title="Public playlists"
            description="The playlists other listeners can discover from your profile."
            action={
              <Link
                href="/library"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                Open library{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            }
          />

          {publicPlaylists.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {publicPlaylists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.slug}`}
                  className="group focus-visible:ring-ring rounded-2xl p-2 transition-colors outline-none hover:bg-white/5 focus-visible:ring-2"
                >
                  <CoverImage
                    src={playlist.coverUrl}
                    alt={`${playlist.title} cover`}
                    className="aspect-square rounded-2xl shadow-[0_16px_45px_rgba(0,0,0,.24)] transition-transform duration-300 group-hover:-translate-y-1"
                  />
                  <p className="mt-3 truncate text-sm font-semibold">
                    {playlist.title}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {playlist.trackIds.length}{" "}
                    {playlist.trackIds.length === 1 ? "track" : "tracks"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border-border bg-surface/40 mt-6 flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
              <Headphones className="text-primary size-6" aria-hidden="true" />
              <p className="mt-3 font-semibold">Nothing public yet</p>
              <p className="text-muted-foreground mt-1 max-w-md text-sm">
                Public playlists you create will appear here.
              </p>
            </div>
          )}
        </section>

        <section className="page-section grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div className="border-border bg-surface/60 rounded-2xl border p-6 sm:p-7">
            <p className="text-primary text-[11px] font-semibold tracking-[.18em] uppercase">
              Account
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.035em]">
              Account overview
            </h2>
            <dl className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <ProfileField
                label="Email"
                value={user.email ?? "Not available"}
              />
              <ProfileField label="Username" value={profileHandle} />
              <ProfileField
                label="Membership"
                value={capabilities.isPremium ? "Premium" : "Free"}
              />
              <ProfileField
                label="Account status"
                value={formatLabel(profile.accountStatus)}
              />
            </dl>
          </div>

          <aside className="border-border relative overflow-hidden rounded-2xl border bg-[linear-gradient(145deg,rgba(142,124,229,.18),rgba(24,24,38,.86))] p-6 sm:p-7">
            <div className="bg-primary/15 text-primary grid size-11 place-items-center rounded-full">
              <CalendarDays className="size-5" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground mt-8 text-xs font-semibold tracking-[.14em] uppercase">
              Nemufy member since
            </p>
            <p className="font-display mt-2 text-3xl font-semibold tracking-[-.04em]">
              {memberSince}
            </p>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              Your listening profile and creator access live together here.
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-primary text-[11px] font-semibold tracking-[.18em] uppercase">
          {eyebrow}
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
          {title}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

function WorkspaceCard({
  href,
  name,
  type,
  role,
  imageUrl,
  icon: Icon,
  admin = false,
}: {
  href: string;
  name: string;
  type: string;
  role: string;
  imageUrl?: string | null;
  icon: LucideIcon;
  admin?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group border-border bg-surface/55 focus-visible:ring-ring rounded-2xl border p-3 transition-[background-color,transform,border-color] outline-none hover:-translate-y-1 hover:border-white/15 hover:bg-white/[.065] focus-visible:ring-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
        {imageUrl ? (
          <CoverImage
            src={imageUrl}
            alt=""
            className="size-full transition-transform duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div
            className={`grid size-full place-items-center ${
              admin
                ? "bg-[radial-gradient(circle_at_70%_18%,rgba(251,113,133,.28),transparent_35%),linear-gradient(145deg,#4b2639,#211923)]"
                : "bg-[radial-gradient(circle_at_70%_18%,rgba(184,168,255,.3),transparent_35%),linear-gradient(145deg,#393455,#1c1d2b)]"
            }`}
          >
            <Icon className="size-10 text-white/85" aria-hidden="true" />
          </div>
        )}
        <Badge className="absolute top-3 left-3 border-white/10 bg-black/45 text-white/80 backdrop-blur-md">
          {type}
        </Badge>
        <span className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-white text-black opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100 sm:translate-y-2">
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="px-1 pt-4 pb-2">
        <h3 className="truncate font-semibold">{name}</h3>
        <p className="text-muted-foreground mt-1 text-xs capitalize">
          {role} access
        </p>
      </div>
    </Link>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-subtle text-[11px] font-semibold tracking-[.13em] uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "N"
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}
