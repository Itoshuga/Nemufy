import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  rejectUntrustedMutation,
} from "@/lib/http/api-response";
import { requireApiActor } from "@/lib/permissions/server";
import { updateUserCapabilities } from "@/lib/services/admin";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const rejected = rejectUntrustedMutation(request);
  if (rejected) return rejected;
  try {
    const actor = await requireApiActor();
    const { uid } = await params;
    const result = await updateUserCapabilities(
      actor,
      uid,
      await request.json(),
    );
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
