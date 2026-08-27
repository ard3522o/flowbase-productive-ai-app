import { NextResponse } from "next/server";
import { requireAuth } from "../_helpers";
import { boards, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId, db } = await requireAuth();
    const userBoards = await db.select().from(boards).where(eq(boards.userId, userId));
    const boardIds = userBoards.map((b) => b.id);
    const userTasks = boardIds.length > 0
      ? await db.select().from(tasks).where(eq(tasks.boardId, boardIds[0]))
      : [];
    return NextResponse.json({ boards: userBoards, tasks: userTasks });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, db } = await requireAuth();
    const body = await req.json();
    const { board, taskList } = body;
    await db.insert(boards).values({ ...board, userId });
    if (taskList?.length) {
      await db.insert(tasks).values(taskList);
    }
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
    const { board, taskList } = body;
    if (board) {
      await db.update(boards).set({ name: board.name, color: board.color, columns: board.columns, updatedAt: new Date() }).where(eq(boards.id, board.id));
    }
    if (taskList) {
      // Delete old tasks for this board and re-insert
      if (board?.id) {
        await db.delete(tasks).where(eq(tasks.boardId, board.id));
        if (taskList.length) await db.insert(tasks).values(taskList);
      }
    }
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
    const boardId = searchParams.get("id");
    if (!boardId) return NextResponse.json({ error: "Missing board id" }, { status: 400 });
    await db.delete(tasks).where(eq(tasks.boardId, boardId));
    await db.delete(boards).where(eq(boards.id, boardId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
