import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { PlatformError } from "@/lib/errors/platform-error";
import { hasTrustedOrigin } from "@/lib/http/origin";

export function rejectUntrustedMutation(request: Request) {
  return hasTrustedOrigin(request)
    ? null
    : NextResponse.json(
        { code: "FORBIDDEN", message: "Invalid request origin." },
        { status: 403 },
      );
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "The submitted data is invalid.",
        fields: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  if (error instanceof PlatformError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status },
    );
  }
  console.error("Nemufy API operation failed", error);
  return NextResponse.json(
    {
      code: "INTERNAL_ERROR",
      message: "The operation could not be completed.",
    },
    { status: 500 },
  );
}
