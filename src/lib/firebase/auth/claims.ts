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
    artist: undefined,
    label: undefined,
  });
}
