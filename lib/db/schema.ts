import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { randomBytes } from "crypto";

/**
 * Generate random ID for Auth.js tables
 */
function generateId(length = 16) {
  return randomBytes(length).toString("hex");
}

/**
 * ============================================================================
 * AUTH.JS v5 TABLES
 * ============================================================================
 */

/**
 * Users table - Auth.js v5 compatible dengan custom fields (tier, phone, dll)
 */
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  // Custom fields untuk SpecFlow
  phone: text("phone"),
  // Sisa dari era Better Auth - hanya dipakai endpoint legacy /api/users (dead code).
  // Login utama pakai Google OAuth, kolom ini nullable.
  passwordHash: text("password_hash"),
  tier: text("tier").notNull().default("Freemium"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Accounts table - Auth.js v5 format untuk OAuth providers
 */
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // oauth | email | credentials
  provider: text("provider").notNull(), // google, github, dll
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"), // Changed from bigint to integer for DrizzleAdapter compatibility
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

// Unique constraint on provider + providerAccountId
// This will be added via migration

/**
 * Sessions table - Auth.js v5 format
 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
  sessionToken: text("session_token").notNull().unique(),
});

/**
 * Verification tokens table - Auth.js v5 format untuk email verification
 */
export const verification_tokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

/**
 * ============================================================================
 * SPECFLOW BUSINESS TABLES
 * ============================================================================
 */

/**
 * Projects table - menyimpan ide awal, jawaban konteks, stack pilihan, hasil PRD, dan status
 */
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  initialIdea: text("initial_idea").notNull(),
  answers: text("answers"),
  techMode: text("tech_mode").notNull().default("auto"),
  stack: text("stack"),
  generatedPrd: text("generated_prd"),
  status: text("status").notNull().default("Draft"),
  tier: text("tier").notNull().default("Freemium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * ProjectMessages table - menyimpan histori interaksi revisi
 */
export const projectMessages = pgTable("project_messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * UsageQuotas table - tracking kuota pemakaian per user per bulan
 */
export const usageQuotas = pgTable("usage_quotas", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  prdCount: integer("prd_count").notNull().default(0),
  chatCount: integer("chat_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Notifications table - in-app notifications
 */
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"),
  actionLabel: text("action_label"),
  read: boolean("read").notNull().default(false),
  metadata: text("metadata"),
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

/**
 * Schema export for DrizzleAdapter compatibility
 */
export const schema = {
  users,
  accounts,
  sessions,
  verification_tokens,
  projects,
  projectMessages,
  usageQuotas,
  notifications,
};
