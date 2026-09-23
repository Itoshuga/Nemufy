export const releaseTypes = ["SINGLE", "EP", "ALBUM"] as const;
export type ReleaseType = (typeof releaseTypes)[number];

export type ArtistLink = {
  label: string;
  url: string;
};

export type ArtistReference = {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  avatar: string;
  verified: boolean;
};

export type Artist = ArtistReference & {
  banner: string;
  bio: string;
  monthlyListeners: number;
  followerCount: number;
  links: ArtistLink[];
  genres: string[];
  createdAt: string;
};

export type AsmrCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  artwork: string;
};

export type Track = {
  id: string;
  slug: string;
  title: string;
  duration: number;
  audioUrl: string;
  cover?: string;
  releaseId: string;
  primaryArtists: ArtistReference[];
  secondaryArtists: ArtistReference[];
  featuredArtists: ArtistReference[];
  trackNumber: number;
  explicit: boolean;
  playCount: number;
  categories: string[];
  tags: string[];
};

export type Release = {
  id: string;
  slug: string;
  title: string;
  cover: string;
  type: ReleaseType;
  releaseDate: string;
  artists: ArtistReference[];
  tracks: Track[];
  description?: string;
  copyright: string;
  explicit: boolean;
  duration: number;
  tags: string[];
};

export type PlaylistCreator =
  | { type: "OFFICIAL"; id: "nemufy"; name: "Nemufy" }
  | { type: "USER"; id: string; name: string; avatar?: string };

export type Playlist = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover: string;
  creator: PlaylistCreator;
  tracks: Track[];
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  createdAt: string;
  updatedAt: string;
};
