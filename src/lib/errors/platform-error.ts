export const platformErrorCodes = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "MEMBERSHIP_REQUIRED",
  "INSUFFICIENT_PERMISSION",
  "USER_NOT_FOUND",
  "ARTIST_NOT_FOUND",
  "LABEL_NOT_FOUND",
  "RELEASE_NOT_FOUND",
  "TRACK_NOT_FOUND",
  "INVALID_RELEASE",
  "UPLOAD_FAILED",
  "VALIDATION_ERROR",
] as const;

export type PlatformErrorCode = (typeof platformErrorCodes)[number];

export class PlatformError extends Error {
  constructor(
    public readonly code: PlatformErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PlatformError";
  }
}

export function forbidden(
  code: Extract<
    PlatformErrorCode,
    "FORBIDDEN" | "MEMBERSHIP_REQUIRED" | "INSUFFICIENT_PERMISSION"
  > = "FORBIDDEN",
) {
  return new PlatformError(code, "You do not have permission to do that.", 403);
}
