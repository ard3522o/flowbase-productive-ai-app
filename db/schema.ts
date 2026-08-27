import { pgTable, serial, text, timestamp, jsonb, varchar, boolean, integer } from "drizzle-orm/pg-core";

/* ── Users (synced from Clerk) ── */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ── Kanban ── */
export const boards = pgTable("boards", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").default("#7C3AED"),
  columns: jsonb("columns").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  boardId: varchar("board_id", { length: 36 }).notNull().references(() => boards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  dueDate: text("due_date"),
  priority: varchar("priority", { length: 10 }).default("medium"),
  labels: jsonb("labels").default([]),
  syncCalendar: boolean("sync_calendar").default(false),
  syncNotes: boolean("sync_notes").default(false),
  columnId: varchar("column_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ── Notes ── */
export const notes = pgTable("notes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").default("Untitled"),
  content: text("content").default(""),
  color: text("color").default("#7C3AED"),
  pinned: boolean("pinned").default(false),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ── Whiteboard ── */
export const whiteboards = pgTable("whiteboards", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").default("#EA580C"),
  canvasData: jsonb("canvas_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ── Spaces ── */
export const spaces = pgTable("spaces", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  color: text("color").default("#4F46E5"),
  favorite: boolean("favorite").default(false),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ── Pages ── */
export const pages = pgTable("pages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: text("user_id").notNull(),
  spaceId: varchar("space_id", { length: 36 }).notNull().references(() => spaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  template: text("template").default("Blank Page"),
  content: text("content").default(""),
  favorite: boolean("favorite").default(false),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Board = typeof boards.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Whiteboard = typeof whiteboards.$inferSelect;
export type Space = typeof spaces.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type GeneratedApp = typeof generatedApps.$inferSelect;


/* ── AI Generated Apps ── */
export const generatedApps = pgTable("generated_apps", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: text("user_id").notNull(),
  appName: text("app_name").notNull(),
  description: text("description").default(""),
  icon: text("icon").default("Sparkles"),
  color: text("color").default("#7C3AED"),
  layout: text("layout").default("single-page"),
  sections: jsonb("sections").default([]),
  actions: jsonb("actions").default([]),
  sampleData: jsonb("sample_data").default([]),
  appData: jsonb("app_data").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});