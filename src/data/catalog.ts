import "server-only";

import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { categories as mockCategories } from "@/data/mock/categories";
import {
  artists as mockArtists,
  playlists as mockPlaylists,
  releases as mockReleases,
  tracks as mockTracks,
} from "@/data/mock/catalog";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { collections } from "@/lib/firebase/firestore/collections";
import type {
  ArtistDocument,
  CategoryDocument,
  PlaylistDocument,
  ReleaseDocument,
  TrackDocument,
} from "@/types/firestore";
import type {
  Artist,
  ArtistReference,
  AsmrCategory,
  Playlist,
  Release,
  Track,
} from "@/types/catalog";

export type Catalog = {
  artists: Artist[];
  releases: Release[];
  tracks: Track[];
  playlists: Playlist[];
  categories: AsmrCategory[];
};

const mockCatalog: Catalog = {
  artists: mockArtists,
  releases: mockReleases,
  tracks: mockTracks,
  playlists: mockPlaylists,
  categories: mockCategories,
};

const toIsoString = (timestamp: { toDate(): Date }) =>
  timestamp.toDate().toISOString();

const isDefined = <Value>(value: Value | undefined): value is Value =>
  value !== undefined;

export async function getCatalog(): Promise<Catalog> {
  if (process.env.FIREBASE_CATALOG_SOURCE !== "firestore") return mockCatalog;

  try {
    return await getFirestoreCatalog();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Firestore catalog unavailable; using typed development mocks.",
        error,
      );
      return mockCatalog;
    }
    throw error;
  }
}

async function getFirestoreCatalog(): Promise<Catalog> {
  const firestore = getFirebaseAdminFirestore();
  const [
    artistSnapshot,
    trackSnapshot,
    releaseSnapshot,
    playlistSnapshot,
    categorySnapshot,
  ] = await Promise.all([
    firestore.collection(collections.artists).get(),
    firestore
      .collection(collections.tracks)
      .where("status", "==", "published")
      .get(),
    firestore
      .collection(collections.releases)
      .where("status", "==", "published")
      .get(),
    firestore
      .collection(collections.playlists)
      .where("visibility", "==", "public")
      .get(),
    firestore.collection(collections.categories).get(),
  ]);

  if (artistSnapshot.empty || trackSnapshot.empty || releaseSnapshot.empty) {
    throw new Error(
      "Firestore catalog is empty. Run pnpm firebase:seed first.",
    );
  }

  const artists = artistSnapshot.docs.map(mapArtist);
  const artistReferences = new Map(
    artists.map((artist) => [artist.id, toArtistReference(artist)]),
  );
  const tracks = trackSnapshot.docs.map((snapshot) =>
    mapTrack(snapshot, artistReferences),
  );
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  const releases = releaseSnapshot.docs.map((snapshot) =>
    mapRelease(snapshot, artistReferences, tracks),
  );
  const playlists = playlistSnapshot.docs.map((snapshot) =>
    mapPlaylist(snapshot, tracksById),
  );
  const categories = categorySnapshot.docs.map(mapCategory);

  return { artists, tracks, releases, playlists, categories };
}

function mapArtist(snapshot: QueryDocumentSnapshot): Artist {
  const data = snapshot.data() as ArtistDocument;
  return {
    id: snapshot.id,
    slug: data.slug,
    name: data.name,
    displayName: data.displayName,
    avatar: data.avatarUrl ?? "/images/art/avatar-placeholder.svg",
    banner: data.bannerUrl ?? "/images/art/banner-placeholder.svg",
    bio: data.bio,
    verified: data.verified,
    monthlyListeners: data.monthlyListeners,
    followerCount: data.followerCount,
    links: data.links,
    genres: data.categoryIds,
    createdAt: toIsoString(data.createdAt),
  };
}

function toArtistReference(artist: Artist): ArtistReference {
  const { id, slug, name, displayName, avatar, verified } = artist;
  return { id, slug, name, displayName, avatar, verified };
}

function mapTrack(
  snapshot: QueryDocumentSnapshot,
  artistReferences: Map<string, ArtistReference>,
): Track {
  const data = snapshot.data() as TrackDocument;
  const references = (ids: string[]) =>
    ids.map((id) => artistReferences.get(id)).filter(isDefined);
  return {
    id: snapshot.id,
    slug: data.slug,
    title: data.title,
    duration: data.durationSeconds,
    audioUrl: data.audioUrl ?? "/audio/quiet-night.wav",
    cover: data.coverUrl ?? undefined,
    releaseId: data.releaseId ?? "",
    primaryArtists: references(data.primaryArtistIds),
    secondaryArtists: references(data.secondaryArtistIds),
    featuredArtists: references(data.featuredArtistIds),
    trackNumber: data.trackNumber ?? 0,
    explicit: data.explicit,
    playCount: data.playCount,
    categories: data.categoryIds,
    tags: data.tags,
  };
}

function mapRelease(
  snapshot: QueryDocumentSnapshot,
  artistReferences: Map<string, ArtistReference>,
  tracks: Track[],
): Release {
  const data = snapshot.data() as ReleaseDocument;
  return {
    id: snapshot.id,
    slug: data.slug,
    title: data.title,
    cover: data.coverUrl ?? "/images/art/release-placeholder.svg",
    type: data.type.toUpperCase() as Release["type"],
    releaseDate: toIsoString(data.releaseDate),
    artists: data.primaryArtistIds
      .map((id) => artistReferences.get(id))
      .filter(isDefined),
    tracks: tracks
      .filter((track) => track.releaseId === snapshot.id)
      .sort((left, right) => left.trackNumber - right.trackNumber),
    description: data.description ?? undefined,
    copyright: data.copyright ?? "",
    explicit: data.explicit,
    duration: data.durationSeconds,
    tags: data.tags,
  };
}

function mapPlaylist(
  snapshot: QueryDocumentSnapshot,
  tracksById: Map<string, Track>,
): Playlist {
  const data = snapshot.data() as PlaylistDocument;
  return {
    id: snapshot.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    cover: data.coverUrl,
    creator:
      data.creator.type === "official"
        ? { type: "OFFICIAL", id: "nemufy", name: "Nemufy" }
        : { type: "USER", id: data.creator.id, name: data.creator.name },
    tracks: data.trackIds.map((id) => tracksById.get(id)).filter(isDefined),
    visibility: data.visibility.toUpperCase() as Playlist["visibility"],
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function mapCategory(snapshot: QueryDocumentSnapshot): AsmrCategory {
  const data = snapshot.data() as CategoryDocument;
  return {
    id: snapshot.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    artwork: data.artworkUrl,
  };
}
