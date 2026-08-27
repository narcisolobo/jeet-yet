import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "__session";
const SESSION_COOKIE_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;
const RECENT_SIGN_IN_WINDOW_MS = 5 * 60 * 1000;

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  return new URL(origin).host === host;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const { idToken } = (await request.json()) as { idToken?: string };
  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, false);
  } catch {
    return NextResponse.json({ error: "Invalid idToken" }, { status: 401 });
  }

  const authTimeMs = decoded.auth_time * 1000;
  if (Date.now() - authTimeMs > RECENT_SIGN_IN_WINDOW_MS) {
    return NextResponse.json({ error: "Sign-in too old" }, { status: 401 });
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE_MS,
  });

  (await cookies()).set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      await adminAuth.revokeRefreshTokens(decoded.uid);
    } catch {
      // Cookie was already invalid/expired — nothing to revoke.
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
