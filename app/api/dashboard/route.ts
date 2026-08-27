import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/_helpers";
import { db } from "@/db";
import { boards, tasks, notes, spaces, whiteboards } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth(req as any);

    const userBoards = await db.select().from(boards).where(eq(boards.userId, userId));
    const userTasks = await db.select().from(tasks);
    const userNotes = await db.select().from(notes).where(eq(notes.userId, userId));
    const userSpaces = await db.select().from(spaces).where(eq(spaces.userId, userId));
    const userWhiteboards = await db.select().from(whiteboards).where(eq(whiteboards.userId, userId));

    const boardIds = userBoards.map((b) => b.id);
    const userBoardTasks = userTasks.filter((t) => boardIds.includes(t.boardId));

    const tasksDone = userBoardTasks.filter((t) => {
      const board = userBoards.find((b) => b.id === t.boardId);
      if (!board) return false;
      const cols = (board.columns as any[]) || [];
      const doneCol = cols.find((c: any) => c.name?.toLowerCase() === "done");
      return doneCol && t.columnId === doneCol.id;
    });

    const today = new Date().toISOString().split("T")[0];
    const overdueTasks = userBoardTasks.filter((t) => t.dueDate && t.dueDate < today);
    const upcomingTasks = userBoardTasks.filter((t) => t.dueDate && t.dueDate >= today).slice(0, 5);

    return NextResponse.json({
      stats: {
        boards: userBoards.length,
        tasks: userBoardTasks.length,
        tasksDone: tasksDone.length,
        notes: userNotes.length,
        spaces: userSpaces.length,
        whiteboards: userWhiteboards.length,
        overdueTasks: overdueTasks.length,
      },
      recentTasks: upcomingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
      recentNotes: userNotes.slice(0, 5).map((n) => ({
        id: n.id,
        title: n.title,
        updatedAt: n.updatedAt,
      })),
    });
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
