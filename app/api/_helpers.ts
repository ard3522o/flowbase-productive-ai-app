import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function requireAuth() {
  const session = await auth();
  if (!session.userId) {
    throw new Error("Unauthorized");
  }
  return { userId: session.userId, db };
}
