import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  rejectUntrustedMutation,
} from "@/lib/http/api-response";
import { requireApiActor } from "@/lib/permissions/server";
import { PlatformError } from "@/lib/errors/platform-error";
import {
  createTrack,
  removeTrackFromRelease,
  reorderTracks,
  saveTrackArtwork,
  updateTrack,
} from "@/lib/services/releases";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const actor = await requireApiActor();
    const { artistId } = await params;
    const result = await createTrack(actor, artistId, await request.json());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const actor = await requireApiActor();
    const { artistId } = await params;
    const body = (await request.json()) as {
      action?: string;
      trackId?: unknown;
      releaseId?: unknown;
      data?: unknown;
      orderedTrackIds?: unknown;
      coverUrl?: unknown;
      coverStoragePath?: unknown;
    };
    if (body.action === "update") {
      await updateTrack(actor, artistId, body.trackId, body.data);
    } else if (body.action === "reorder") {
      await reorderTracks(actor, artistId, body.releaseId, {
        orderedTrackIds: body.orderedTrackIds,
      });
    } else if (body.action === "artwork") {
      await saveTrackArtwork(actor, artistId, body.trackId, {
        coverUrl: body.coverUrl,
        coverStoragePath: body.coverStoragePath,
      });
    } else {
      throw new PlatformError("VALIDATION_ERROR", "Unknown track action.", 400);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const actor = await requireApiActor();
    const { artistId } = await params;
    const body = (await request.json()) as { trackId?: unknown };
    await removeTrackFromRelease(actor, artistId, body.trackId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
