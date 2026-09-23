import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { categories } from "../src/data/mock/categories";
import { artists, playlists, releases, tracks } from "../src/data/mock/catalog";

process.loadEnvFile?.(".env.local");

const requiredEnvironment = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
] as const;

for (const key of requiredEnvironment) {
  if (!process.env[key]) throw new Error(`Missing ${key} in .env.local`);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID as string;
const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    projectId,
    storageBucket: process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
  });
const firestore = getFirestore(app);
const now = Timestamp.now();
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

async function seedCatalog() {
  const collectionNames = [
    "artists",
    "tracks",
    "releases",
    "playlists",
    "categories",
  ];
  const existingCounts = Object.fromEntries(
    await Promise.all(
      collectionNames.map(async (name) => [
        name,
        (await firestore.collection(name).count().get()).data().count,
      ]),
    ),
  ) as Record<string, number>;

  if (dryRun) {
    console.log("Firebase project:", projectId);
    console.log("Existing catalog documents:", existingCounts);
    console.log("Documents prepared:", {
      artists: artists.length,
      tracks: tracks.length,
      releases: releases.length,
      playlists: playlists.length,
      categories: categories.length,
    });
    return;
  }

  if (!force && Object.values(existingCounts).some((count) => count > 0)) {
    throw new Error(
      "Catalog collections are not empty. Re-run with --force only after reviewing the existing data.",
    );
  }

  const batch = firestore.batch();
  for (const artist of artists) {
    batch.set(
      firestore.collection("artists").doc(artist.id),
      {
        name: artist.name,
        displayName: artist.displayName,
        slug: artist.slug,
        avatarUrl: artist.avatar,
        bannerUrl: artist.banner,
        bio: artist.bio,
        verified: artist.verified,
        monthlyListeners: artist.monthlyListeners,
        followerCount: artist.followerCount,
        categoryIds: artist.genres.map(toSlug),
        links: artist.links,
        createdAt: Timestamp.fromDate(new Date(artist.createdAt)),
        updatedAt: now,
        schemaVersion: 1,
      },
      { merge: true },
    );
  }

  for (const item of tracks) {
    const artistCredits = [
      ...item.primaryArtists.map((artist, position) => ({
        artistId: artist.id,
        role: "primary",
        position,
      })),
      ...item.secondaryArtists.map((artist, position) => ({
        artistId: artist.id,
        role: "secondary",
        position,
      })),
      ...item.featuredArtists.map((artist, position) => ({
        artistId: artist.id,
        role: "featured",
        position,
      })),
    ];
    const primaryArtistIds = item.primaryArtists.map((artist) => artist.id);
    const secondaryArtistIds = item.secondaryArtists.map((artist) => artist.id);
    const featuredArtistIds = item.featuredArtists.map((artist) => artist.id);
    batch.set(
      firestore.collection("tracks").doc(item.id),
      {
        title: item.title,
        slug: item.slug,
        releaseId: item.releaseId || null,
        primaryArtistIds,
        secondaryArtistIds,
        featuredArtistIds,
        allArtistIds: [
          ...new Set([
            ...primaryArtistIds,
            ...secondaryArtistIds,
            ...featuredArtistIds,
          ]),
        ],
        artistCredits,
        durationSeconds: item.duration,
        audioUrl: item.audioUrl,
        coverUrl: item.cover ?? null,
        trackNumber: item.trackNumber || null,
        explicit: item.explicit,
        categoryIds: item.categories,
        tags: item.tags,
        status: "published",
        playCount: item.playCount,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
        schemaVersion: 1,
      },
      { merge: true },
    );
  }

  for (const release of releases) {
    const primaryArtistIds = release.artists.map((artist) => artist.id);
    const featuredArtistIds = [
      ...new Set(
        release.tracks.flatMap((track) =>
          track.featuredArtists.map((artist) => artist.id),
        ),
      ),
    ];
    batch.set(
      firestore.collection("releases").doc(release.id),
      {
        title: release.title,
        slug: release.slug,
        type: release.type.toLowerCase(),
        primaryArtistIds,
        featuredArtistIds,
        allArtistIds: [...new Set([...primaryArtistIds, ...featuredArtistIds])],
        coverUrl: release.cover,
        description: release.description ?? null,
        releaseDate: Timestamp.fromDate(new Date(release.releaseDate)),
        status: "published",
        copyright: release.copyright || null,
        explicit: release.explicit,
        durationSeconds: release.duration,
        tags: release.tags,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      },
      { merge: true },
    );
  }

  for (const playlist of playlists) {
    batch.set(
      firestore.collection("playlists").doc(playlist.id),
      {
        title: playlist.title,
        slug: playlist.slug,
        description: playlist.description,
        coverUrl: playlist.cover,
        creator: {
          type: playlist.creator.type.toLowerCase(),
          id: playlist.creator.id,
          name: playlist.creator.name,
        },
        trackIds: playlist.tracks.map((track) => track.id),
        visibility: playlist.visibility.toLowerCase(),
        createdAt: Timestamp.fromDate(new Date(playlist.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(playlist.updatedAt)),
        schemaVersion: 1,
      },
      { merge: true },
    );
  }

  for (const category of categories) {
    batch.set(
      firestore.collection("categories").doc(category.id),
      {
        name: category.name,
        slug: category.slug,
        description: category.description,
        artworkUrl: category.artwork,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
      },
      { merge: true },
    );
  }

  await batch.commit();
  console.log("Nemufy catalog seeded successfully in project", projectId);
}

void seedCatalog().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Firestore seed failed.",
  );
  process.exitCode = 1;
});

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
}
