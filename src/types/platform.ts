export const systemCapabilityNames = ["artist", "label", "admin"] as const;
export type SystemCapability = (typeof systemCapabilityNames)[number];

export type UserCapabilities = Record<SystemCapability, boolean>;

export type SubscriptionPlan = "free" | "premium";
export type SubscriptionStatus =
  "active" | "inactive" | "trialing" | "past_due" | "cancelled";

export type ArtistMembershipRole = "owner" | "manager" | "editor";
export type ArtistMembershipStatus = "active" | "pending" | "revoked";

export type ArtistPermissions = {
  manageProfile: boolean;
  manageReleases: boolean;
  manageTracks: boolean;
  publish: boolean;
  manageTeam: boolean;
  viewAnalytics: boolean;
};

export type LabelMembershipRole = "owner" | "admin" | "manager" | "editor";
export type LabelMembershipStatus = "active" | "pending" | "revoked";

export type LabelPermissions = {
  manageLabel: boolean;
  manageArtists: boolean;
  manageReleases: boolean;
  manageTracks: boolean;
  publish: boolean;
  manageTeam: boolean;
  viewAnalytics: boolean;
};

export type LabelArtistPermissions = {
  manageProfile: boolean;
  manageReleases: boolean;
  manageTracks: boolean;
  publish: boolean;
};

export const permissionActions = [
  "artist:view",
  "artist:edit",
  "artist:manage-team",
  "release:create",
  "release:edit",
  "release:delete",
  "release:publish",
  "track:create",
  "track:edit",
  "track:delete",
  "label:view",
  "label:edit",
  "label:manage-artists",
  "label:manage-team",
  "analytics:view",
  "user:manage",
  "platform:admin",
] as const;

export type PermissionAction = (typeof permissionActions)[number];

export type UserCapabilitySummary = {
  isUser: true;
  isPremium: boolean;
  isArtist: boolean;
  isLabelMember: boolean;
  isAdmin: boolean;
};

export type StudioContext =
  | {
      type: "artist";
      id: string;
      name: string;
      imageUrl: string | null;
      role: ArtistMembershipRole | "label";
    }
  | {
      type: "label";
      id: string;
      name: string;
      imageUrl: string | null;
      role: LabelMembershipRole;
    };

export const emptyUserCapabilities: UserCapabilities = {
  artist: false,
  label: false,
  admin: false,
};

export function isPremiumUser(input: {
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
}) {
  return (
    input.subscriptionPlan === "premium" &&
    (input.subscriptionStatus === "active" ||
      input.subscriptionStatus === "trialing")
  );
}
