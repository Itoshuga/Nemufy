import { z } from "zod";
import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  rejectUntrustedMutation,
} from "@/lib/http/api-response";
import { requireApiActor } from "@/lib/permissions/server";
import { updateArtistModeration } from "@/lib/services/admin";

export const runtime = "nodejs";

const moderationSchema = z
  .object({
    verified: z.boolean().optional(),
    status: z.enum(["active", "suspended", "archived"]).optional(),
  })
  .refine(
    (input) => input.verified !== undefined || input.status !== undefined,
  );

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const actor = await requireApiActor();
    const { artistId } = await params;
    await updateArtistModeration(
      actor,
      artistId,
      moderationSchema.parse(await request.json()),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
