import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/_helpers";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { userId, db } = await requireAuth(req);
    const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (rows.length === 0) {
      const defaults = {
        id: randomUUID(),
        userId,
        categories: [],
        aiFeatures: { refine: true, assistant: true, templateBuilder: true },
        notifications: { email: true, push: true, taskReminders: true, calendarAlerts: true },
      };
      await db.insert(userSettings).values(defaults);
      return NextResponse.json(defaults);
    }
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, db } = await requireAuth(req);
    const body = await req.json();
    const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (existing.length === 0) {
      await db.insert(userSettings).values({ id: randomUUID(), userId, ...body });
    } else {
      await db.update(userSettings).set({ ...body, updatedAt: new Date() }).where(eq(userSettings.userId, userId));
    }
    const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
