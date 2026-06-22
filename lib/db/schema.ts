import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { generateId } from "better-auth";

/**
 * Users table - menyimpan profil pengguna, tier aktif, dan kuota pemakaian
 * Compatible with Better Auth
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  phone: text("phone"),
  tier: text("tier").notNull().default("Freemium"), // Freemium | Starter | Pro
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }), // Tanggal berakhirnya langganan (null = Freemium)
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Sessions table - untuk Better Auth session management
 */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Accounts table - untuk Better Auth OAuth provider support
 * Required by better-auth even for email/password auth
 */
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  password: text("password"),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Projects table - menyimpan ide awal, jawaban konteks, stack pilihan, hasil PRD, dan status
 */
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  initialIdea: text("initial_idea").notNull(),
  answers: text("answers"), // JSON string dari QuestionState
  techMode: text("tech_mode").notNull().default("auto"), // auto | manual
  stack: text("stack"), // JSON string dari StackSelections
  generatedPrd: text("generated_prd"), // Markdown content
  status: text("status").notNull().default("Draft"), // Draft | Generated | Needs_review
  tier: text("tier").notNull().default("Freemium"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * ProjectMessages table - menyimpan histori interaksi revisi antara user dan AI reviewer
 */
export const projectMessages = sqliteTable("project_messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user | assistant | system
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * UsageQuotas table - menyimpan tracking kuota pemakaian per user per bulan
 */
export const usageQuotas = sqliteTable("usage_quotas", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // Format: YYYY-MM (e.g., "2026-06")
  prdCount: integer("prd_count").notNull().default(0),
  chatCount: integer("chat_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Notifications table - menyimpan in-app notifications untuk user
 */
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // info | success | warning | error | quota_warning | payment_success | prd_generated | chat_reply
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"),
  actionLabel: text("action_label"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  metadata: text("metadata"), // JSON string untuk data tambahan
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Type exports
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectMessage = typeof projectMessages.$inferSelect;
export type NewProjectMessage = typeof projectMessages.$inferInsert;
export type UsageQuota = typeof usageQuotas.$inferSelect;
export type NewUsageQuota = typeof usageQuotas.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
