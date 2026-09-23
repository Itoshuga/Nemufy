import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  getFirebaseClientApp,
  shouldUseFirebaseEmulators,
} from "@/lib/firebase/client";

let emulatorConnected = false;

export function getFirebaseClientFirestore(): Firestore {
  const firestore = getFirestore(getFirebaseClientApp());
  if (
    typeof window !== "undefined" &&
    shouldUseFirebaseEmulators() &&
    !emulatorConnected
  ) {
    connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
    emulatorConnected = true;
  }
  return firestore;
}
