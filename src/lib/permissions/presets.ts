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
  viewer: {
    manageProfile: false,
    manageReleases: false,
    manageTracks: false,
    publish: false,
    manageTeam: false,
    viewAnalytics: true,
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
  viewer: {
    manageLabel: false,
    manageArtists: false,
    manageReleases: false,
    manageTracks: false,
    publish: false,
    manageTeam: false,
    viewAnalytics: true,
  },
};

export const defaultLabelArtistPermissions: Readonly<LabelArtistPermissions> = {
  manageProfile: true,
  manageReleases: true,
  manageTracks: true,
  publish: true,
};

export function getEffectiveArtistPermissions(input: {
  role: ArtistMembershipRole;
  permissionOverrides?: Partial<ArtistPermissions>;
}) {
  return {
    ...artistPermissionPresets[input.role],
    ...(input.permissionOverrides ?? {}),
  };
}

export function getEffectiveLabelPermissions(input: {
  role: LabelMembershipRole;
  permissionOverrides?: Partial<LabelPermissions>;
}) {
  return {
    ...labelPermissionPresets[input.role],
    ...(input.permissionOverrides ?? {}),
  };
}
