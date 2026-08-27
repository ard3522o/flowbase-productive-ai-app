import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Approach 1: Try Clerk auth()
    let userId: string | null = null;
    let userName = "User";
    let userEmail = "";
    let userAvatar = "";

    try {
      const session = await auth();
      if (session?.userId) {
        userId = session.userId;
        const user = await currentUser();
        if (user) {
          userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User";
          userEmail = user.emailAddresses?.[0]?.emailAddress || "";
          userAvatar = user.imageUrl || "";
        }
      }
    } catch (e) {
      // auth() failed, try manual cookie extraction
    }

    // Approach 2: Fallback - extract from Clerk session cookie manually
    if (!userId) {
      const cookieHeader = request.headers.get("cookie") || "";
      // Clerk v7 uses instance-scoped names: __session_<instanceId>
      const cookies = cookieHeader.split(";").map(c => c.trim());
      for (const cookie of cookies) {
        const eqIndex = cookie.indexOf("=");
        if (eqIndex < 0) continue;
        const name = cookie.substring(0, eqIndex);
        const value = cookie.substring(eqIndex + 1);
        // Match any __session cookie (instance-scoped or plain)
        if (name === "__session" || name.startsWith("__session_")) {
          try {
            const parts = value.split(".");
            if (parts.length >= 2) {
              const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
              if (payload.sub && payload.sub.startsWith("user_")) {
                userId = payload.sub;
                // Try to get user info from JWT claims
                if (payload.name) userName = payload.name;
                if (payload.email) userEmail = payload.email;
                if (payload.picture) userAvatar = payload.picture;
                break;
              }
            }
          } catch { /* not a valid JWT, skip */ }
        }
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "No authenticated user" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lbSession = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        color: "#7C3AED",
      },
    });

    lbSession.allow("*", ["room:write"]);

    const { status, body } = await lbSession.authorize();
    return new Response(body, { status });
  } catch (err: any) {
    console.error("[liveblocks-auth] ERROR:", err.message);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
