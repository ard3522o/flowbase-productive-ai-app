import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AuthSyncPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;

  if (!clerkUser || !email) {
    throw new Error("Unable to sync the signed-in user because no primary email is available.");
  }

  const name = clerkUser.fullName || null;

  await db
    .insert(users)
    .values({
      clerkId: clerkUser.id,
      email,
      name,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email,
        name,
      },
    });

  redirect("/");
}
