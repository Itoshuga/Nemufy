import "server-only";

import { getFirebaseAdminStorage } from "@/lib/firebase/admin";

export const getServerStorageBucket = () => getFirebaseAdminStorage().bucket();
