import Link from "next/link";
import { Album, Music2, Plus } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/firebase/auth/server";
import { getReleasesForArtist } from "@/lib/firebase/firestore/repositories/releases";
import { getTracksForArtist } from "@/lib/firebase/firestore/repositories/tracks";
import { can } from "@/lib/permissions/can";
import { getArtistPermissionContext } from "@/lib/permissions/server";
import { cn } from "@/lib/utils";

export default async function ManageArtistMusicPage({
  params,
  searchParams,
}: {
  params: Promise<{ artistId: string }>;
  searchParams: Promise<{ view?: string; status?: string; type?: string }>;
}) {
  const { artistId } = await params;
  const filters = await searchParams;
  const { user } = await requireActiveUser();
  const [releases, tracks, context] = await Promise.all([
    getReleasesForArtist(artistId),
    getTracksForArtist(artistId),
    getArtistPermissionContext(user.uid, artistId, user.claims.admin),
  ]);
  const view = filters.view === "tracks" ? "tracks" : "releases";
  const visibleReleases = releases.filter(
    (release) =>
      (!filters.status || release.status === filters.status) &&
      (!filters.type || release.type === filters.type),
  );
  const canCreate = can(context, "release:create");

  return (
    <BackofficePage
      eyebrow="Artist"
      title="Music"
      description="Singles, EPs, albums and their tracks in one place."
      action={
        canCreate ? (
          <Button asChild>
            <Link href={`/manage/artists/${artistId}/music/new`}>
              <Plus /> New release
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="inline-flex w-fit rounded-full border border-white/8 bg-white/3 p-1"
          aria-label="Music view"
        >
          <MusicTab
            href={`/manage/artists/${artistId}/music`}
            active={view === "releases"}
          >
            Releases
          </MusicTab>
          <MusicTab
            href={`/manage/artists/${artistId}/music?view=tracks`}
            active={view === "tracks"}
          >
            Tracks
          </MusicTab>
        </nav>
        {view === "releases" ? (
          <form className="flex flex-wrap gap-2">
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="manage-filter"
            >
              <option value="">Status: All</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
            <select
              name="type"
              defaultValue={filters.type ?? ""}
              className="manage-filter"
            >
              <option value="">Type: All</option>
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="album">Album</option>
            </select>
            <Button size="sm" variant="secondary">
              Apply
            </Button>
          </form>
        ) : null}
      </div>

      <div className="mt-5">
        {view === "releases" ? (
          visibleReleases.length === 0 ? (
            <EmptyState
              icon={Album}
              title="No releases found"
              description="Create your first release or change the active filters."
              action={
                canCreate ? (
                  <Button asChild>
                    <Link href={`/manage/artists/${artistId}/music/new`}>
                      New release
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <DataTable
              label="Artist releases"
              columns={["Release", "Type", "Tracks", "Status", "Date"]}
            >
              {visibleReleases.map((release) => (
                <tr key={release.id} className="hover:bg-white/[.025]">
                  <DataCell>
                    <Link
                      href={`/manage/releases/${release.id}`}
                      className="hover:text-primary font-medium"
                    >
                      {release.title}
                    </Link>
                  </DataCell>
                  <DataCell className="uppercase">{release.type}</DataCell>
                  <DataCell>
                    {
                      tracks.filter((track) => track.releaseId === release.id)
                        .length
                    }
                  </DataCell>
                  <DataCell>
                    <StatusBadge status={release.status} />
                  </DataCell>
                  <DataCell>
                    {release.releaseDate.toDate().toLocaleDateString()}
                  </DataCell>
                </tr>
              ))}
            </DataTable>
          )
        ) : tracks.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="No tracks yet"
            description="Tracks are added from inside a release."
          />
        ) : (
          <DataTable
            label="Artist tracks"
            columns={["Track", "Release", "Duration", "Status"]}
          >
            {tracks.map((track) => (
              <tr key={track.id}>
                <DataCell>
                  <p className="font-medium">{track.title}</p>
                </DataCell>
                <DataCell>
                  {track.releaseId ? (
                    <Link
                      href={`/manage/releases/${track.releaseId}`}
                      className="text-primary text-xs"
                    >
                      Open release
                    </Link>
                  ) : (
                    "—"
                  )}
                </DataCell>
                <DataCell>
                  {Math.floor(track.durationSeconds / 60)}:
                  {String(track.durationSeconds % 60).padStart(2, "0")}
                </DataCell>
                <DataCell>
                  <StatusBadge status={track.status} />
                </DataCell>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </BackofficePage>
  );
}

function MusicTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-xs font-semibold",
        active
          ? "text-foreground bg-white/9"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
