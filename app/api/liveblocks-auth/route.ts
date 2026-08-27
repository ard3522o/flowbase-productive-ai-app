import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function GET() {
  console.log("[liveblocks-auth] GET hit - route is reachable");
  return new Response(JSON.stringify({ status: "ok", hasSecretKey: !!process.env.LIVEBLOCKS_SECRET_KEY }), { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const hasClerkSession = cookieHeader.includes("__session");
    
    console.log("[liveblocks-auth] POST hit");
    console.log("[liveblocks-auth] Has Clerk session cookie:", hasClerkSession);

    const session = await auth();
    const userId = session.userId;

    console.log("[liveblocks-auth] userId:", userId ?? "null");

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const metadata = (session.sessionClaims?.metadata ?? {}) as Record<string, string>;
    const firstName = (session.sessionClaims?.firstName as string | undefined) ?? "";
    const lastName = (session.sessionClaims?.lastName as string | undefined) ?? "";
    const email = (session.sessionClaims?.email as string | undefined) ?? "";
    const name = metadata.name || [firstName, lastName].filter(Boolean).join(" ") || "Anonymous";
    const avatar = metadata.avatar ?? "";
    const color = metadata.color ?? "#7C3AED";

    const lbSession = liveblocks.prepareSession(userId, {
      userInfo: { name, email, avatar, color },
    });

    lbSession.allow("*", ["room:write"]);

    const { status, body } = await lbSession.authorize();
    console.log("[liveblocks-auth] SUCCESS:", userId);
    return new Response(body, { status });
  } catch (err: any) {
    console.error("[liveblocks-auth] ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
