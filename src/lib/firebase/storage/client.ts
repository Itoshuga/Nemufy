import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";
import {
  getFirebaseClientApp,
  shouldUseFirebaseEmulators,
} from "@/lib/firebase/client";

let emulatorConnected = false;

export function getFirebaseClientStorage(): FirebaseStorage {
  const storage = getStorage(getFirebaseClientApp());
  if (
    typeof window !== "undefined" &&
    shouldUseFirebaseEmulators() &&
    !emulatorConnected
  ) {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    emulatorConnected = true;
  }
  return storage;
}
