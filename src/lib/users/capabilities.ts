import type { UserDocument } from "@/types/firestore";
import { isPremiumUser, type UserCapabilitySummary } from "@/types/platform";

export function getUserCapabilitySummary(
  profile: UserDocument,
): UserCapabilitySummary {
  return {
    isUser: true,
    isPremium: isPremiumUser(profile),
    isArtist: profile.capabilities.artist,
    isLabelMember: profile.capabilities.label,
    isAdmin: profile.capabilities.admin,
  };
}
