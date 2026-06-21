/**
 * Drizzle ORM schema — 5 tables from 02-db-schema.md
 * Phone number = identity. All money in integer paise (BIGINT).
 */
import {
  pgTable,
  uuid,
  text,
  boolean,
  bigint,
  timestamp,
  date,
  jsonb,
  time,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// users — auto-created on first WhatsApp message
// ---------------------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").unique().notNull(),
    name: text("name"),
    timezone: text("timezone").default("Asia/Kolkata"),
    morningBriefTime: time("morning_brief_time").default("07:00"),
    tier: text("tier").default("free"),
    monthlyIncomePaise: bigint("monthly_income_paise", { mode: "number" }),
    cityTier: text("city_tier"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("idx_users_phone").on(t.phone)]
);

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    rawMessage: text("raw_message"),
    status: text("status").default("pending"),
    category: text("category"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    remindAt: timestamp("remind_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    reminderSent: boolean("reminder_sent").default(false),
    source: text("source").default("whatsapp"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_tasks_user_status").on(t.userId, t.status),
    index("idx_tasks_user_due").on(t.userId, t.dueAt),
    index("idx_tasks_remind").on(t.remindAt),
  ]
);

// ---------------------------------------------------------------------------
// expenses — all amounts in paise (Rs200 = 20000)
// ---------------------------------------------------------------------------
export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    category: text("category").notNull(),
    merchant: text("merchant"),
    description: text("description"),
    source: text("source").default("whatsapp"),
    transactionDate: date("transaction_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_expenses_user_date").on(t.userId, t.transactionDate),
    index("idx_expenses_user_category").on(t.userId, t.category),
  ]
);

// ---------------------------------------------------------------------------
// messages — audit log of all WhatsApp messages (inbound + outbound)
// ---------------------------------------------------------------------------
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    waMessageId: text("wa_message_id").unique(),
    direction: text("direction").notNull(),
    body: text("body").notNull(),
    intent: text("intent"),
    parsedData: jsonb("parsed_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_messages_wa_id").on(t.waMessageId),
    index("idx_messages_user").on(t.userId, t.createdAt),
  ]
);

// ---------------------------------------------------------------------------
// web_sessions — magic link auth for web dashboard
// ---------------------------------------------------------------------------
export const webSessions = pgTable(
  "web_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").unique().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("idx_sessions_token").on(t.token)]
);

// ---------------------------------------------------------------------------
// Type exports for use across the app
// ---------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type WebSession = typeof webSessions.$inferSelect;
export type NewWebSession = typeof webSessions.$inferInsert;
