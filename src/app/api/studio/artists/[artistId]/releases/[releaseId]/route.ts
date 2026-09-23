import { z } from "zod";
import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  rejectUntrustedMutation,
} from "@/lib/http/api-response";
import { requireApiActor } from "@/lib/permissions/server";
import {
  archiveRelease,
  discardDraftRelease,
  duplicateRelease,
  publishRelease,
  saveReleaseArtwork,
  updateRelease,
} from "@/lib/services/releases";

export const runtime = "nodejs";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("discard") }),
  z.object({ action: z.literal("duplicate") }),
  z.object({ action: z.literal("update"), data: z.unknown() }),
  z.object({
    action: z.literal("artwork"),
    coverUrl: z.url(),
    coverStoragePath: z.string().min(1).max(500),
  }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ artistId: string; releaseId: string }> },
) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const actor = await requireApiActor();
    const { artistId, releaseId } = await params;
    const input = actionSchema.parse(await request.json());
    if (input.action === "publish") {
      await publishRelease(actor, artistId, releaseId);
    } else if (input.action === "archive") {
      await archiveRelease(actor, artistId, releaseId);
    } else if (input.action === "discard") {
      await discardDraftRelease(actor, artistId, releaseId);
    } else if (input.action === "duplicate") {
      const result = await duplicateRelease(actor, artistId, releaseId);
      return NextResponse.json({ success: true, ...result });
    } else if (input.action === "update") {
      await updateRelease(actor, artistId, releaseId, input.data);
    } else {
      await saveReleaseArtwork(actor, artistId, releaseId, input);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
