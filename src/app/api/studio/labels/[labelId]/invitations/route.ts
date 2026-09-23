import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  rejectUntrustedMutation,
} from "@/lib/http/api-response";
import { requireApiActor } from "@/lib/permissions/server";
import { inviteLabelMember } from "@/lib/services/invitations";

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
    const result = await inviteLabelMember(
      actor,
      labelId,
      await request.json(),
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
