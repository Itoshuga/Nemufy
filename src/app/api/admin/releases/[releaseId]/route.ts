import { z } from "zod";
import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  rejectUntrustedMutation,
} from "@/lib/http/api-response";
import { getReleaseById } from "@/lib/firebase/firestore/repositories/releases";
import { requireApiActor } from "@/lib/permissions/server";
import {
  archiveRelease,
  publishRelease,
  unpublishRelease,
} from "@/lib/services/releases";
import { PlatformError } from "@/lib/errors/platform-error";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["publish", "unpublish", "archive"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ releaseId: string }> },
) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const actor = await requireApiActor();
    if (!actor.user.claims.admin) {
      throw new PlatformError(
        "FORBIDDEN",
        "Administrator access required.",
        403,
      );
    }
    const { releaseId } = await params;
    const { action } = schema.parse(await request.json());
    const release = await getReleaseById(releaseId);
    if (!release) {
      throw new PlatformError("RELEASE_NOT_FOUND", "Release not found.", 404);
    }
    const artistId = release.primaryArtistIds[0];
    if (!artistId) {
      throw new PlatformError(
        "INVALID_RELEASE",
        "Missing primary artist.",
        422,
      );
    }
    if (action === "publish") {
      await publishRelease(actor, artistId, releaseId);
    } else if (action === "archive") {
      await archiveRelease(actor, artistId, releaseId);
    } else {
      await unpublishRelease(actor, releaseId);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
