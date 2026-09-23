import { artists, playlists, releases, tracks } from "@/data/mock/catalog";

export const getArtistBySlug = (slug: string) =>
  artists.find((artist) => artist.slug === slug);

export const getReleaseBySlug = (slug: string) =>
  releases.find((release) => release.slug === slug);

export const getPlaylistBySlug = (slug: string) =>
  playlists.find((playlist) => playlist.slug === slug);

export const getReleasesByArtistId = (artistId: string) =>
  releases.filter((release) =>
    release.artists.some((artist) => artist.id === artistId),
  );

export const getAppearancesByArtistId = (artistId: string) =>
  releases.filter(
    (release) =>
      !release.artists.some((artist) => artist.id === artistId) &&
      release.tracks.some(
        (track) =>
          track.featuredArtists.some((artist) => artist.id === artistId) ||
          track.secondaryArtists.some((artist) => artist.id === artistId),
      ),
  );

export const getPopularTracksByArtistId = (artistId: string) =>
  tracks
    .filter((track) =>
      [...track.primaryArtists, ...track.featuredArtists].some(
        (artist) => artist.id === artistId,
      ),
    )
    .sort((a, b) => b.playCount - a.playCount);

export const getPlaylistDuration = (playlistSlug: string) => {
  const playlist = getPlaylistBySlug(playlistSlug);
  return playlist?.tracks.reduce((sum, track) => sum + track.duration, 0) ?? 0;
};
