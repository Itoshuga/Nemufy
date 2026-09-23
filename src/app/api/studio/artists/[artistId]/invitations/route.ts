import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  rejectUntrustedMutation,
} from "@/lib/http/api-response";
import { requireApiActor } from "@/lib/permissions/server";
import { inviteArtistMember } from "@/lib/services/invitations";

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
    const result = await inviteArtistMember(
      actor,
      artistId,
      await request.json(),
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
