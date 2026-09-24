import type { UserDocument } from "@/types/firestore";
import { isPremiumUser, type UserCapabilitySummary } from "@/types/platform";

export function getUserCapabilitySummary(
  profile: UserDocument,
  access?: {
    hasArtistMembership: boolean;
    hasLabelMembership: boolean;
    isAdmin: boolean;
  },
): UserCapabilitySummary {
  return {
    isUser: true,
    isPremium: isPremiumUser(profile),
    isArtist: access?.hasArtistMembership ?? profile.capabilities.artist,
    isLabelMember: access?.hasLabelMembership ?? profile.capabilities.label,
    isAdmin: access?.isAdmin ?? profile.capabilities.admin,
  };
}
