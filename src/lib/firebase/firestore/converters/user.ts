import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import type { UserDocument } from "@/types/firestore";

export const userConverter: FirestoreDataConverter<UserDocument, DocumentData> =
  {
    toFirestore(user: UserDocument): DocumentData {
      return user;
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions,
    ): UserDocument {
      return snapshot.data(options) as UserDocument;
    },
  };
