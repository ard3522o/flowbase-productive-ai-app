import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../_helpers";
import { generatedApps } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

function uid() {
  return crypto.randomUUID();
}

/* GET - list all generated apps for the user */
export async function GET(req: NextRequest) {
  try {
    const { userId, db } = await requireAuth(req);
    const apps = await db
      .select()
      .from(generatedApps)
      .where(eq(generatedApps.userId, userId))
      .orderBy(desc(generatedApps.createdAt));
    return NextResponse.json({ apps });
  } catch (e: any) {
    if (e.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* POST - create an app manually (from saved JSON) or generate via AI */
export async function POST(req: NextRequest) {
  try {
    const { userId, db } = await requireAuth(req);
    const body = await req.json();

    /* ── AI generation ── */
    if (body.prompt && typeof body.prompt === "string") {
      if (!process.env.GOOGLE_AI_API_KEY) {
        return NextResponse.json(
          { error: "GOOGLE_AI_API_KEY not configured" },
          { status: 500 }
        );
      }

      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

      const systemPrompt = `You are an expert single-page app generator. Given a user prompt describing an app idea, return ONLY a valid JSON object (no markdown, no code fences, no explanation).

The JSON must match this exact structure:

{
  "appName": "string - the app name",
  "description": "string - short 1-2 sentence description",
  "icon": "string - Lucide icon name like Flame, Dumbbell, Apple, BookOpen, Brain, Wallet, Calendar, ListChecks, Target, Heart, UtensilsCrossed, GraduationCap, Clock, BarChart3, CheckCircle2, ShoppingBag, Briefcase, Star, Compass, Zap",
  "color": "string - hex color like #F97316",
  "layout": "single-page",
  "sections": [
    {
      "id": "string unique",
      "type": "stats|list|table|form|checklist|chart|tags|progress",
      "title": "string section title",
      "items": [ array of section-specific items ]
    }
  ],
  "actions": [
    { "id": "string unique", "label": "string button label", "icon": "string Lucide icon name", "variant": "primary|secondary|danger" }
  ],
  "sampleData": [
    { "id": "string unique", "name": "string", "value": "string|number", "status": "active|completed|pending|archived", "category": "string", "date": "YYYY-MM-DD", "progress": 0-100 }
  ]
}

GUIDELINES:
- Generate 2-5 sections based on what makes sense for the app.
- Section types: stats for dashboard numbers, list for items, table for structured data, form for input, checklist for tasks, chart for visual, tags for labels, progress for progress bars.
- Each section's "items" array should contain relevant objects matching the section type.
- For stats sections, items: [{ "label": "string", "value": "string|number", "icon": "string", "trend": "up|down|neutral" }]
- For list sections, items: [{ "title": "string", "subtitle": "string", "icon": "string", "color": "string" }]
- For table sections, items: [{ "columns": ["col1", "col2", ...] }]
- For checklist sections, items: [{ "label": "string", "checked": false }]
- For progress sections, items: [{ "label": "string", "value": 0-100, "color": "string" }]
- For tags sections, items: [{ "label": "string", "color": "string" }]
- For chart sections, items: [{ "label": "string", "value": number }]
- sampleData should have 3-8 realistic sample entries.
- actions should have 2-4 relevant action buttons.
- colors should be warm, inviting, and cohesive.
- Return ONLY the JSON object.`;

      const result = await model.generateContent([
        systemPrompt,
        `Generate a single-page app for: "${body.prompt}"`,
      ]);

      const text = result.response.text();

      /* Extract JSON */
      let jsonStr = text.trim();
      /* strip markdown fences if present */
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const appData = JSON.parse(jsonStr);

      const id = uid();
      await db.insert(generatedApps).values({
        id,
        userId,
        appName: appData.appName || body.prompt,
        description: appData.description || "",
        icon: appData.icon || "Sparkles",
        color: appData.color || "#7C3AED",
        layout: appData.layout || "single-page",
        sections: appData.sections || [],
        actions: appData.actions || [],
        sampleData: appData.sampleData || [],
        appData,
      });

      return NextResponse.json({ app: { id, ...appData } });
    }

    /* ── Manual save ── */
    if (body.appData) {
      const ad = body.appData;
      const id = uid();
      await db.insert(generatedApps).values({
        id,
        userId,
        appName: ad.appName || body.appName || "Untitled App",
        description: ad.description || body.description || "",
        icon: ad.icon || "Sparkles",
        color: ad.color || "#7C3AED",
        layout: ad.layout || "single-page",
        sections: ad.sections || [],
        actions: ad.actions || [],
        sampleData: ad.sampleData || [],
        appData: ad,
      });
      return NextResponse.json({ app: { id, ...ad } });
    }

    return NextResponse.json({ error: "Prompt or appData required" }, { status: 400 });
  } catch (e: any) {
    console.error("[templates] Error:", e.message);
    if (e.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* DELETE - delete an app */
export async function DELETE(req: NextRequest) {
  try {
    const { userId, db } = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("id");
    if (!appId)
      return NextResponse.json({ error: "Missing app id" }, { status: 400 });
    await db
      .delete(generatedApps)
      .where(eq(generatedApps.id, appId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* PUT - update an existing app */
export async function PUT(req: NextRequest) {
  try {
    const { userId, db } = await requireAuth(req);
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Missing app id" }, { status: 400 });
    const updates: any = { updatedAt: new Date() };
    if (body.appData) {
      updates.appData = body.appData;
      if (body.appData.sections) updates.sections = body.appData.sections;
      if (body.appData.sampleData) updates.sampleData = body.appData.sampleData;
    }
    await db.update(generatedApps).set(updates).where(eq(generatedApps.id, body.id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
