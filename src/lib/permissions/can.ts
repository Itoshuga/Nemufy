import type {
  ArtistMembershipDocument,
  LabelArtistRelationDocument,
  LabelMembershipDocument,
} from "@/types/firestore";
import type { PermissionAction } from "@/types/platform";
import {
  getEffectiveArtistPermissions,
  getEffectiveLabelPermissions,
} from "@/lib/permissions/presets";

export type PermissionContext = {
  isAdmin: boolean;
  artistMembership?: ArtistMembershipDocument | null;
  labelMembership?: LabelMembershipDocument | null;
  labelArtistRelation?: LabelArtistRelationDocument | null;
  labelPaths?: Array<{
    membership: LabelMembershipDocument;
    relation: LabelArtistRelationDocument;
  }>;
};

const isActiveArtistMember = (
  membership: ArtistMembershipDocument | null | undefined,
) => membership?.status === "active";

const isActiveLabelPath = ({
  labelMembership,
  labelArtistRelation,
}: PermissionContext) =>
  labelMembership?.status === "active" &&
  labelArtistRelation?.status === "active" &&
  labelMembership.labelId === labelArtistRelation.labelId;

function getActiveLabelPaths(context: PermissionContext) {
  if (context.labelPaths) {
    return context.labelPaths.filter(
      ({ membership, relation }) =>
        membership.status === "active" &&
        relation.status === "active" &&
        membership.labelId === relation.labelId,
    );
  }
  return isActiveLabelPath(context) &&
    context.labelMembership &&
    context.labelArtistRelation
    ? [
        {
          membership: context.labelMembership,
          relation: context.labelArtistRelation,
        },
      ]
    : [];
}

export function getLabelIdForArtistAction(
  context: PermissionContext,
  action:
    | "artist:edit"
    | "release:create"
    | "release:edit"
    | "track:create"
    | "track:edit",
) {
  const path = getActiveLabelPaths(context).find(({ membership, relation }) => {
    if (action === "artist:edit") {
      const labelPermissions = getEffectiveLabelPermissions(membership);
      return (
        labelPermissions.manageArtists && relation.permissions.manageProfile
      );
    }
    if (action === "release:create" || action === "release:edit") {
      const labelPermissions = getEffectiveLabelPermissions(membership);
      return (
        labelPermissions.manageReleases && relation.permissions.manageReleases
      );
    }
    const labelPermissions = getEffectiveLabelPermissions(membership);
    return labelPermissions.manageTracks && relation.permissions.manageTracks;
  });
  return path?.membership.labelId;
}

export function can(context: PermissionContext, action: PermissionAction) {
  if (context.isAdmin) return true;

  const artist = isActiveArtistMember(context.artistMembership)
    ? getEffectiveArtistPermissions(context.artistMembership!)
    : null;
  const labelPaths = getActiveLabelPaths(context);

  switch (action) {
    case "artist:view":
      return Boolean(artist || labelPaths.length > 0);
    case "artist:edit":
      return Boolean(
        artist?.manageProfile ||
        labelPaths.some(
          ({ membership, relation }) =>
            getEffectiveLabelPermissions(membership).manageArtists &&
            relation.permissions.manageProfile,
        ),
      );
    case "artist:manage-team":
      return Boolean(artist?.manageTeam);
    case "release:create":
    case "release:edit":
    case "release:delete":
      return Boolean(
        artist?.manageReleases ||
        labelPaths.some(
          ({ membership, relation }) =>
            getEffectiveLabelPermissions(membership).manageReleases &&
            relation.permissions.manageReleases,
        ),
      );
    case "release:publish":
      return Boolean(
        artist?.publish ||
        labelPaths.some(
          ({ membership, relation }) =>
            getEffectiveLabelPermissions(membership).publish &&
            relation.permissions.publish,
        ),
      );
    case "track:create":
    case "track:edit":
    case "track:delete":
      return Boolean(
        artist?.manageTracks ||
        labelPaths.some(
          ({ membership, relation }) =>
            getEffectiveLabelPermissions(membership).manageTracks &&
            relation.permissions.manageTracks,
        ),
      );
    case "label:view":
      return context.labelMembership?.status === "active";
    case "label:edit":
      return Boolean(
        context.labelMembership?.status === "active" &&
        getEffectiveLabelPermissions(context.labelMembership).manageLabel,
      );
    case "label:manage-artists":
      return Boolean(
        context.labelMembership?.status === "active" &&
        getEffectiveLabelPermissions(context.labelMembership).manageArtists,
      );
    case "label:manage-team":
      return Boolean(
        context.labelMembership?.status === "active" &&
        getEffectiveLabelPermissions(context.labelMembership).manageTeam,
      );
    case "analytics:view":
      return Boolean(
        artist?.viewAnalytics ||
        labelPaths.some(
          ({ membership }) =>
            getEffectiveLabelPermissions(membership).viewAnalytics,
        ) ||
        (context.labelMembership?.status === "active" &&
          getEffectiveLabelPermissions(context.labelMembership).viewAnalytics),
      );
    case "user:manage":
    case "platform:admin":
      return false;
  }
}

export const canManageArtist = (context: PermissionContext) =>
  can(context, "artist:edit");
export const canCreateRelease = (context: PermissionContext) =>
  can(context, "release:create");
export const canPublishRelease = (context: PermissionContext) =>
  can(context, "release:publish");
export const canManageArtistTeam = (context: PermissionContext) =>
  can(context, "artist:manage-team");
