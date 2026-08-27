import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "@/app/api/_helpers";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are Nestwork AI, a powerful productivity assistant.

When the user asks you to CREATE or DO something, respond with an action block AND a friendly message.

Action format (wrap in <action> tags):
<action>{"type":"action_name","params":{...}}</action>

Available actions:
1. create_task - params: { title, description?, boardName?, columnName?, priority?: "low"|"medium"|"high", dueDate?: "YYYY-MM-DD" }
2. create_board - params: { name, color? }
3. create_note - params: { title, content? }
4. create_calendar_event - params: { title, date: "YYYY-MM-DD", time?, description? }
5. create_whiteboard - params: { name, description? }
6. create_template - params: { prompt }

RULES:
- If the request is clear, execute immediately with action + confirmation.
- If info is missing (e.g. no date), ask a follow-up FIRST.
- Be concise, friendly, helpful.
- Use markdown when helpful.
- Current date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
`;

function extractActions(text: string): { actions: any[]; cleanText: string } {
  const actions: any[] = [];
  const actionRegex = /<action>(\{.*?\})<\/action>/gs;
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    try { actions.push(JSON.parse(match[1])); } catch {}
  }
  return { actions, cleanText: text.replace(/<action>[\s\S]*?<\/action>/g, "").trim() };
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) return NextResponse.json({ error: "Messages required" }, { status: 400 });
    if (!process.env.GOOGLE_AI_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const chatHistory = messages.map((m: Msg) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const chat = model.startChat({ systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] }, history: chatHistory.slice(0, -1) });
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const responseText = result.response.text();
    const { actions, cleanText } = extractActions(responseText);

    const actionResults: any[] = [];
    for (const action of actions) {
      try {
        const res = await executeAction(action, userId);
        actionResults.push({ action, result: res });
      } catch (e: any) { actionResults.push({ action, error: e.message }); }
    }
    return NextResponse.json({ message: cleanText || "Done!", actions: actionResults });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message || "AI error" }, { status: 500 });
  }
}

async function executeAction(action: any, userId: string) {
  const { db } = await import("@/db");
  const schema = await import("@/db/schema");
  const { randomUUID } = await import("crypto");
  const { eq } = await import("drizzle-orm");

  switch (action.type) {
    case "create_task": {
      const { title, description, boardName, columnName, priority, dueDate } = action.params;
      const userBoards = await db.select().from(schema.boards).where(eq(schema.boards.userId, userId));
      let board = boardName ? userBoards.find((b: any) => b.name.toLowerCase().includes(boardName.toLowerCase())) : userBoards[0];
      if (!board) return { success: false, message: "No boards found. Create one first." };
      const cols = (board.columns as any[]) || [];
      const col = columnName ? cols.find((c: any) => c.name.toLowerCase().includes(columnName.toLowerCase())) : cols[0];
      if (!col) return { success: false, message: "Column not found." };
      await db.insert(schema.tasks).values({ id: randomUUID(), boardId: board.id, title, description: description || "", dueDate: dueDate || null, priority: priority || "medium", labels: [], columnId: col.id });
      return { success: true, message: "Task '" + title + "' created in " + board.name };
    }
    case "create_board": {
      const { name, color } = action.params;
      const defaultCols = [{ id: randomUUID(), name: "Todo" }, { id: randomUUID(), name: "In Progress" }, { id: randomUUID(), name: "Done" }];
      await db.insert(schema.boards).values({ id: randomUUID(), userId, name, color: color || "#7C3AED", columns: defaultCols });
      return { success: true, message: "Board '" + name + "' created." };
    }
    case "create_note": {
      const { title, content } = action.params;
      await db.insert(schema.notes).values({ id: randomUUID(), userId, title, content: content || "", color: "#ffffff" });
      return { success: true, message: "Note '" + title + "' created." };
    }
    case "create_calendar_event": {
      const { title, date, time, description } = action.params;
      await db.insert(schema.notes).values({ id: randomUUID(), userId, title: "[Event] " + title, content: "Date: " + date + (time ? " at " + time : "") + (description ? "\n" + description : ""), color: "#f0f9ff" });
      return { success: true, message: "Event '" + title + "' scheduled for " + date + "." };
    }
    case "create_whiteboard": {
      const { name } = action.params;
      await db.insert(schema.whiteboards).values({ id: randomUUID(), userId, name, color: "#EA580C", canvasData: { elements: [], appState: {} } });
      return { success: true, message: "Whiteboard '" + name + "' created." };
    }
    case "create_template": {
      return { success: true, message: "Visit AI Template Builder to generate.", redirect: "/templates" };
    }
    default:
      return { success: false, message: "Unknown action: " + action.type };
  }
}
