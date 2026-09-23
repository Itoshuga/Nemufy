import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth/server";
import {
  completeUserOnboarding,
  UsernameTakenError,
} from "@/lib/firebase/firestore/repositories/users";
import { hasTrustedOrigin } from "@/lib/http/origin";
import { onboardingSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 },
    );
  }

  const user = await getCurrentUser();
  if (!user || !user.email_verified) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  const parsedBody = onboardingSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        message: "Check the information you entered.",
        fieldErrors: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    await completeUserOnboarding(user.uid, parsedBody.data);
    return NextResponse.json({ destination: "/" });
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      return NextResponse.json(
        {
          message: "That username is already taken.",
          fieldErrors: { username: ["Choose another username."] },
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Your profile could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
