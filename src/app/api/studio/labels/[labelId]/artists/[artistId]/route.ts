import { z } from "zod";
import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  rejectUntrustedMutation,
} from "@/lib/http/api-response";
import { requireApiActor } from "@/lib/permissions/server";
import { changeLabelArtistRelation } from "@/lib/services/labels";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ labelId: string; artistId: string }> },
) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const actor = await requireApiActor();
    const { labelId, artistId } = await params;
    const { action } = z
      .object({ action: z.enum(["activate", "end"]) })
      .parse(await request.json());
    await changeLabelArtistRelation(actor, labelId, artistId, action);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
