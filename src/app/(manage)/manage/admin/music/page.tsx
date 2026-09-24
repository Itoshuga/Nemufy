import Link from "next/link";
import { Album, Music2, Search } from "lucide-react";
import { BackofficePage } from "@/components/manage/backoffice-page";
import { Button } from "@/components/ui/button";
import { DataCell, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listArtists } from "@/lib/firebase/firestore/repositories/artists";
import { listCategories } from "@/lib/firebase/firestore/repositories/categories";
import { getActiveLabelRelationsForArtist } from "@/lib/firebase/firestore/repositories/label-artists";
import { listLabels } from "@/lib/firebase/firestore/repositories/labels";
import { listReleasesPage } from "@/lib/firebase/firestore/repositories/releases";
import { listTracksPage } from "@/lib/firebase/firestore/repositories/tracks";
import { cn } from "@/lib/utils";

export default async function ManageAdminMusicPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    q?: string;
    status?: string;
    artist?: string;
    label?: string;
    category?: string;
    explicit?: string;
    type?: string;
    cursor?: string;
  }>;
}) {
  const filters = await searchParams;
  const view = filters.view === "tracks" ? "tracks" : "releases";
  const [artists, labels, categories, releasePage, trackPage] =
    await Promise.all([
      listArtists(100),
      listLabels(100),
      listCategories(),
      view === "releases"
        ? listReleasesPage(filters.cursor)
        : Promise.resolve({ releases: [], nextCursor: undefined }),
      view === "tracks"
        ? listTracksPage(filters.cursor)
        : Promise.resolve({ tracks: [], nextCursor: undefined }),
    ]);
  const releases = releasePage.releases;
  const tracks = trackPage.tracks;
  const artistMap = new Map(artists.map((artist) => [artist.id, artist]));
  const labelMap = new Map(labels.map((label) => [label.id, label]));
  const relations = await Promise.all(
    artists.map((artist) => getActiveLabelRelationsForArtist(artist.id)),
  );
  const artistLabelMap = new Map(
    artists.map((artist, index) => [artist.id, relations[index][0]?.labelId]),
  );
  const query = filters.q?.trim().toLowerCase() ?? "";
  const visibleReleases = releases.filter(
    (release) =>
      (!query || release.title.toLowerCase().includes(query)) &&
      (!filters.status || release.status === filters.status) &&
      (!filters.type || release.type === filters.type) &&
      (!filters.artist || release.allArtistIds.includes(filters.artist)) &&
      (!filters.label ||
        release.allArtistIds.some(
          (id) => artistLabelMap.get(id) === filters.label,
        )),
  );
  const visibleTracks = tracks.filter(
    (track) =>
      (!query || track.title.toLowerCase().includes(query)) &&
      (!filters.status || track.status === filters.status) &&
      (!filters.artist || track.allArtistIds.includes(filters.artist)) &&
      (!filters.label ||
        track.allArtistIds.some(
          (id) => artistLabelMap.get(id) === filters.label,
        )) &&
      (!filters.category || track.categoryIds.includes(filters.category)) &&
      (!filters.explicit || track.explicit === (filters.explicit === "true")),
  );
  return (
    <BackofficePage
      eyebrow="Administration"
      title="Music"
      description="Releases and tracks share one catalog workspace."
    >
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav
          className="inline-flex w-fit rounded-full border border-white/8 bg-white/3 p-1"
          aria-label="Catalog view"
        >
          <Tab href="/manage/admin/music" active={view === "releases"}>
            Releases
          </Tab>
          <Tab
            href="/manage/admin/music?view=tracks"
            active={view === "tracks"}
          >
            Tracks
          </Tab>
        </nav>
        <form className="flex flex-wrap gap-2">
          {view === "tracks" ? (
            <input type="hidden" name="view" value="tracks" />
          ) : null}
          <label className="relative min-w-48 flex-1">
            <Search className="text-subtle absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Search music…"
              className="manage-filter w-full pl-9"
            />
          </label>
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="manage-filter"
          >
            <option value="">Status: All</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <select
            name="artist"
            defaultValue={filters.artist ?? ""}
            className="manage-filter"
          >
            <option value="">Artist: All</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.displayName || artist.name}
              </option>
            ))}
          </select>
          <select
            name="label"
            defaultValue={filters.label ?? ""}
            className="manage-filter"
          >
            <option value="">Label: All</option>
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
          {view === "releases" ? (
            <>
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
            </>
          ) : (
            <>
              <select
                name="category"
                defaultValue={filters.category ?? ""}
                className="manage-filter"
              >
                <option value="">Category: All</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                name="explicit"
                defaultValue={filters.explicit ?? ""}
                className="manage-filter"
              >
                <option value="">Explicit: All</option>
                <option value="false">Clean</option>
                <option value="true">Explicit</option>
              </select>
            </>
          )}
          <Button size="sm" variant="secondary">
            Apply
          </Button>
        </form>
      </div>
      <div className="mt-5">
        {view === "releases" ? (
          visibleReleases.length === 0 ? (
            <EmptyState
              icon={Album}
              title="No releases found"
              description="Change the active filters."
            />
          ) : (
            <DataTable
              label="All releases"
              columns={[
                "Release",
                "Artist",
                "Label",
                "Type",
                "Status",
                "Release date",
              ]}
            >
              {visibleReleases.map((release) => {
                const artistId = release.primaryArtistIds[0];
                const labelId = artistId
                  ? artistLabelMap.get(artistId)
                  : undefined;
                return (
                  <tr key={release.id}>
                    <DataCell>
                      <Link
                        href={`/manage/releases/${release.id}`}
                        className="hover:text-primary font-medium"
                      >
                        {release.title}
                      </Link>
                    </DataCell>
                    <DataCell>
                      {artistId
                        ? (artistMap.get(artistId)?.displayName ??
                          artistMap.get(artistId)?.name ??
                          "Artist")
                        : "—"}
                    </DataCell>
                    <DataCell>
                      {labelId
                        ? (labelMap.get(labelId)?.name ?? "Label")
                        : "Independent"}
                    </DataCell>
                    <DataCell className="uppercase">{release.type}</DataCell>
                    <DataCell>
                      <StatusBadge status={release.status} />
                    </DataCell>
                    <DataCell>
                      {release.releaseDate.toDate().toLocaleDateString()}
                    </DataCell>
                  </tr>
                );
              })}
            </DataTable>
          )
        ) : visibleTracks.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="No tracks found"
            description="Change the active filters."
          />
        ) : (
          <DataTable
            label="All tracks"
            columns={["Track", "Artist", "Release", "Duration", "Status"]}
          >
            {visibleTracks.map((track) => (
              <tr key={track.id}>
                <DataCell>
                  <p className="font-medium">{track.title}</p>
                </DataCell>
                <DataCell>
                  {track.primaryArtistIds
                    .map(
                      (id) =>
                        artistMap.get(id)?.displayName ??
                        artistMap.get(id)?.name ??
                        "Artist",
                    )
                    .join(", ")}
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
      {(view === "releases" ? releasePage.nextCursor : trackPage.nextCursor) ? (
        <div className="mt-5 flex justify-end">
          <Button asChild variant="secondary">
            <Link
              href={nextMusicPageHref(
                filters,
                (view === "releases"
                  ? releasePage.nextCursor
                  : trackPage.nextCursor)!,
              )}
            >
              Next page
            </Link>
          </Button>
        </div>
      ) : null}
    </BackofficePage>
  );
}

function nextMusicPageHref(
  filters: {
    view?: string;
    q?: string;
    status?: string;
    artist?: string;
    label?: string;
    category?: string;
    explicit?: string;
    type?: string;
  },
  cursor: string,
) {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) parameters.set(key, value);
  }
  parameters.set("cursor", cursor);
  return `/manage/admin/music?${parameters}`;
}

function Tab({
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
