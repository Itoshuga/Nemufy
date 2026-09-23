export const collections = {
  users: "users",
  usernames: "usernames",
  artists: "artists",
  releases: "releases",
  tracks: "tracks",
  playlists: "playlists",
  categories: "categories",
  artistMemberships: "artistMemberships",
  labels: "labels",
  labelMemberships: "labelMemberships",
  labelArtists: "labelArtists",
  invitations: "invitations",
  auditLogs: "auditLogs",
} as const;

export const userSubcollections = {
  likedTracks: "likedTracks",
  followedArtists: "followedArtists",
  history: "history",
  settings: "settings",
} as const;
