import type {
  ArtistMembershipRole,
  ArtistPermissions,
  LabelArtistPermissions,
  LabelMembershipRole,
  LabelPermissions,
} from "@/types/platform";

export const artistPermissionPresets: Record<
  ArtistMembershipRole,
  Readonly<ArtistPermissions>
> = {
  owner: {
    manageProfile: true,
    manageReleases: true,
    manageTracks: true,
    publish: true,
    manageTeam: true,
    viewAnalytics: true,
  },
  manager: {
    manageProfile: true,
    manageReleases: true,
    manageTracks: true,
    publish: true,
    manageTeam: false,
    viewAnalytics: true,
  },
  editor: {
    manageProfile: true,
    manageReleases: true,
    manageTracks: true,
    publish: false,
    manageTeam: false,
    viewAnalytics: false,
  },
};

export const labelPermissionPresets: Record<
  LabelMembershipRole,
  Readonly<LabelPermissions>
> = {
  owner: {
    manageLabel: true,
    manageArtists: true,
    manageReleases: true,
    manageTracks: true,
    publish: true,
    manageTeam: true,
    viewAnalytics: true,
  },
  admin: {
    manageLabel: true,
    manageArtists: true,
    manageReleases: true,
    manageTracks: true,
    publish: true,
    manageTeam: true,
    viewAnalytics: true,
  },
  manager: {
    manageLabel: true,
    manageArtists: true,
    manageReleases: true,
    manageTracks: true,
    publish: true,
    manageTeam: false,
    viewAnalytics: true,
  },
  editor: {
    manageLabel: false,
    manageArtists: false,
    manageReleases: true,
    manageTracks: true,
    publish: false,
    manageTeam: false,
    viewAnalytics: false,
  },
};

export const defaultLabelArtistPermissions: Readonly<LabelArtistPermissions> = {
  manageProfile: true,
  manageReleases: true,
  manageTracks: true,
  publish: true,
};

export function getArtistPermissions(role: ArtistMembershipRole) {
  return { ...artistPermissionPresets[role] };
}

export function getLabelPermissions(role: LabelMembershipRole) {
  return { ...labelPermissionPresets[role] };
}
