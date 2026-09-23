import "server-only";

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import type { UserCapabilities } from "@/types/platform";

export async function syncSystemCapabilityClaims(
  uid: string,
  capabilities: UserCapabilities,
) {
  const auth = getFirebaseAdminAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, {
    ...(user.customClaims ?? {}),
    admin: capabilities.admin || undefined,
    artist: capabilities.artist || undefined,
    label: capabilities.label || undefined,
  });
}

export async function ensureSystemCapabilityClaim(
  uid: string,
  capability: keyof UserCapabilities,
) {
  const auth = getFirebaseAdminAuth();
  const user = await auth.getUser(uid);
  if (user.customClaims?.[capability] === true) return;
  await auth.setCustomUserClaims(uid, {
    ...(user.customClaims ?? {}),
    [capability]: true,
  });
}
