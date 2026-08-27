import { NextResponse } from "next/server";
import { requireAuth } from "../_helpers";
import { spaces, pages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId, db } = await requireAuth();
    const userSpaces = await db.select().from(spaces).where(eq(spaces.userId, userId));
    const userPages = await db.select().from(pages).where(eq(pages.userId, userId));
    return NextResponse.json({ spaces: userSpaces, pages: userPages });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, db } = await requireAuth();
    const body = await req.json();
    await db.insert(spaces).values({ ...body, userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, db } = await requireAuth();
    const body = await req.json();
    const { id, ...updates } = body;
    await db.update(spaces).set({ ...updates, updatedAt: new Date() }).where(eq(spaces.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId, db } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    // Cascade: delete pages in this space first
    await db.delete(pages).where(eq(pages.spaceId, id));
    await db.delete(spaces).where(eq(spaces.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
