import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/nemufyapp.firebasestorage.app/o/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/studio/artists/:artistId/releases/new",
        destination: "/manage/artists/:artistId/music/new",
        permanent: false,
      },
      {
        source: "/studio/artists/:artistId/releases/:releaseId",
        destination: "/manage/releases/:releaseId",
        permanent: false,
      },
      {
        source: "/studio/artists/:artistId/releases",
        destination: "/manage/artists/:artistId/music",
        permanent: false,
      },
      {
        source: "/studio/artists/:artistId/tracks",
        destination: "/manage/artists/:artistId/music?view=tracks",
        permanent: false,
      },
      {
        source: "/studio/artists/:artistId/profile",
        destination: "/manage/artists/:artistId/profile",
        permanent: false,
      },
      {
        source: "/studio/artists/:artistId/team",
        destination: "/manage/artists/:artistId/team",
        permanent: false,
      },
      {
        source: "/studio/artists/:artistId/:section?",
        destination: "/manage/artists/:artistId",
        permanent: false,
      },
      {
        source: "/studio/labels/:labelId/artists",
        destination: "/manage/labels/:labelId/artists",
        permanent: false,
      },
      {
        source: "/studio/labels/:labelId/catalog",
        destination: "/manage/labels/:labelId/music",
        permanent: false,
      },
      {
        source: "/studio/labels/:labelId/team",
        destination: "/manage/labels/:labelId/team",
        permanent: false,
      },
      {
        source: "/studio/labels/:labelId/settings",
        destination: "/manage/labels/:labelId/profile",
        permanent: false,
      },
      {
        source: "/studio/labels/:labelId/:section?",
        destination: "/manage/labels/:labelId",
        permanent: false,
      },
      {
        source: "/studio/:path*",
        destination: "/manage",
        permanent: false,
      },
      {
        source: "/admin/artists/:artistId",
        destination: "/manage/artists/:artistId",
        permanent: false,
      },
      {
        source: "/admin/labels/:labelId",
        destination: "/manage/labels/:labelId",
        permanent: false,
      },
      {
        source: "/admin/releases/:releaseId",
        destination: "/manage/releases/:releaseId",
        permanent: false,
      },
      {
        source: "/admin/releases",
        destination: "/manage/admin/music",
        permanent: false,
      },
      {
        source: "/admin/tracks/:trackId?",
        destination: "/manage/admin/music?view=tracks",
        permanent: false,
      },
      {
        source: "/admin/playlists/:playlistId",
        destination: "/manage/admin/playlists",
        permanent: false,
      },
      {
        source: "/admin/categories",
        destination: "/manage/admin/platform",
        permanent: false,
      },
      {
        source: "/admin/moderation",
        destination: "/manage/admin/platform",
        permanent: false,
      },
      {
        source: "/admin/settings",
        destination: "/manage/admin/platform",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/manage/admin/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
