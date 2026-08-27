import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "__session";

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  try {
    await adminAuth.verifySessionCookie(sessionCookie, false);
  } catch {
    const response = NextResponse.redirect(
      new URL("/auth/sign-in", request.url),
    );
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/onboarding/:path*"],
};
