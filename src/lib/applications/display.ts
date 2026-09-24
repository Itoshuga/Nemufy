import type { ApplicationDocument } from "@/types/firestore";

export const applicationTypeLabels = {
  artist_claim: "Artist claim",
  artist_creation: "New artist",
  label_creation: "New label",
} as const;

export const applicationStatusLabels = {
  pending: "Pending",
  under_review: "Under review",
  needs_information: "More information needed",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
} as const;

export function applicationSubject(application: ApplicationDocument) {
  if (application.type === "artist_creation") {
    return application.requestedArtist?.name ?? "New artist";
  }
  if (application.type === "label_creation") {
    return application.requestedLabel?.name ?? "New label";
  }
  return "Artist profile claim";
}

export function isApplicationActive(application: ApplicationDocument) {
  return ["pending", "under_review", "needs_information"].includes(
    application.status,
  );
}
