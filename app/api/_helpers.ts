import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { NextRequest } from "next/server";

/**
 * Extract userId from Clerk's session cookie manually.
 * Clerk v7 uses instance-scoped cookie names: __session_<instanceId>
 */
function extractUserIdFromCookies(request: NextRequest): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map(c => c.trim());
  for (const cookie of cookies) {
    const eqIndex = cookie.indexOf("=");
    if (eqIndex < 0) continue;
    const name = cookie.substring(0, eqIndex);
    const value = cookie.substring(eqIndex + 1);
    if (name === "__session" || name.startsWith("__session_")) {
      try {
        const parts = value.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
          if (payload.sub && payload.sub.startsWith("user_")) {
            return payload.sub;
          }
        }
      } catch { /* not a valid JWT */ }
    }
  }
  return null;
}

export async function requireAuth(request?: NextRequest) {
  // Try Clerk auth() first
  try {
    const session = await auth();
    if (session?.userId) {
      return { userId: session.userId, db };
    }
  } catch { /* auth() failed */ }

  // Fallback: extract from cookie
  if (request) {
    const userId = extractUserIdFromCookies(request);
    if (userId) return { userId, db };
  }

  throw new Error("Unauthorized");
}
