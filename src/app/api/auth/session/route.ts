import { z } from "zod";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/firebase/auth/server";
import { ensureUserProfile } from "@/lib/firebase/firestore/repositories/users";
import { hasTrustedOrigin } from "@/lib/http/origin";

export const runtime = "nodejs";

const sessionRequestSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 },
    );
  }

  const parsedBody = sessionRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Invalid authentication token." },
      { status: 400 },
    );
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(
      parsedBody.data.idToken,
      true,
    );
    const authenticationAgeSeconds = Date.now() / 1000 - decodedToken.auth_time;
    if (authenticationAgeSeconds > 30 * 60) {
      return NextResponse.json(
        { message: "Please sign in again to refresh your secure session." },
        { status: 401 },
      );
    }

    const profile = await ensureUserProfile(decodedToken);
    if (!profile || profile.accountStatus !== "active") {
      return NextResponse.json(
        { message: "This account is unavailable." },
        { status: 403 },
      );
    }

    const sessionCookie = await auth.createSessionCookie(
      parsedBody.data.idToken,
      {
        expiresIn: SESSION_DURATION_MS,
      },
    );
    const destination = !decodedToken.email_verified
      ? "/verify-email"
      : profile.onboardingCompleted
        ? "/"
        : "/onboarding";
    const response = NextResponse.json({ destination });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
      priority: "high",
    });
    return response;
  } catch {
    return NextResponse.json(
      { message: "Authentication could not be verified. Please try again." },
      { status: 401 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
