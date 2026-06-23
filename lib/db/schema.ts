import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { generateId } from "better-auth";

/**
 * Users table - menyimpan profil pengguna, tier aktif, dan kuota pemakaian
 * Compatible with Better Auth (PostgreSQL version)
 */
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  phone: text("phone"),
  tier: text("tier").notNull().default("Freemium"), // Freemium | Starter | Pro
  currentPeriodEnd: timestamp("current_period_end"), // Tanggal berakhirnya langganan (null = Freemium)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Sessions table - untuk Better Auth session management
 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Accounts table - untuk Better Auth OAuth provider support
 * Required by better-auth even for email/password auth
 */
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Verification table - untuk Better Auth email verification
 * Required by Better Auth even when verification is disabled
 */
export const verification = pgTable("verification", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Projects table - menyimpan ide awal, jawaban konteks, stack pilihan, hasil PRD, dan status
 */
export const projects = pgTable("projects", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * ProjectMessages table - menyimpan histori interaksi revisi antara user dan AI reviewer
 */
export const projectMessages = pgTable("project_messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user | assistant | system
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * UsageQuotas table - menyimpan tracking kuota pemakaian per user per bulan
 */
export const usageQuotas = pgTable("usage_quotas", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // Format: YYYY-MM (e.g., "2026-06")
  prdCount: text("prd_count").notNull().default("0"), // Store as string, convert to number when needed
  chatCount: text("chat_count").notNull().default("0"), // Store as string, convert to number when needed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Notifications table - menyimpan in-app notifications untuk user
 */
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // info | success | warning | error | quota_warning | payment_success | prd_generated | chat_reply
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"),
  actionLabel: text("action_label"),
  read: boolean("read").notNull().default(false),
  metadata: text("metadata"), // JSON string untuk data tambahan
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
