import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  rejectUntrustedMutation,
} from "@/lib/http/api-response";
import { requireApiActor } from "@/lib/permissions/server";
import { z } from "zod";
import { createArtistForLabel, requestArtistLink } from "@/lib/services/labels";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ labelId: string }> },
) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const actor = await requireApiActor();
    const { labelId } = await params;
    const input = z
      .discriminatedUnion("flow", [
        z.object({
          flow: z.literal("new"),
          name: z.string(),
          description: z.string().optional(),
        }),
        z.object({ flow: z.literal("existing"), artistId: z.string().min(1) }),
      ])
      .parse(await request.json());
    if (input.flow === "existing") {
      await requestArtistLink(actor, labelId, input.artistId);
      return NextResponse.json({ success: true }, { status: 201 });
    }
    const result = await createArtistForLabel(actor, labelId, input);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
