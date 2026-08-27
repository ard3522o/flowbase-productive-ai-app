import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const metadata = (sessionClaims?.metadata ?? {}) as Record<string, string>;
  const firstName = (sessionClaims?.firstName as string | undefined) ?? "";
  const lastName = (sessionClaims?.lastName as string | undefined) ?? "";
  const email = (sessionClaims?.email as string | undefined) ?? "";
  const name = metadata.name || [firstName, lastName].filter(Boolean).join(" ") || "Anonymous";
  const avatar = metadata.avatar ?? "";
  const color = metadata.color ?? "#7C3AED";

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name, email, avatar, color },
  });

  // Allow access to all rooms
  session.allow("*", ["room:write"]);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
