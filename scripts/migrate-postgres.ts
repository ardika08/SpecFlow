/**
 * SQLite to PostgreSQL Migration Script
 * Usage: npx tsx scripts/migrate-postgres.ts
 *
 * This script exports data from SQLite and imports to PostgreSQL.
 * Run this after setting DATABASE_URL to your PostgreSQL connection string.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";

const sqlitePath = process.env.SQLITE_PATH || "local.db";
const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function migrate() {
  console.log("Starting SQLite to PostgreSQL migration...");

  // Connect to SQLite
  console.log("Connecting to SQLite:", sqlitePath);
  const sqlite = new Database(sqlitePath);
  const sqliteDb = drizzle(sqlite, { schema });

  // Connect to PostgreSQL
  console.log("Connecting to PostgreSQL...");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sql = neon(postgresUrl!);
  const pgDb = drizzleNeon(sql, { schema });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pgSchema = schema as any;

    // Migrate users
    console.log("Migrating users...");
    const users = await sqliteDb.select().from(schema.users);
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      await pgDb.insert(pgSchema.users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: (user as any).avatar || (user as any).image, // Handle both old and new field names
        phone: user.phone,
        tier: user.tier,
        currentPeriodEnd: user.currentPeriodEnd,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }).onConflictDoNothing();
    }

    // Migrate sessions
    console.log("Migrating sessions...");
    const sessions = await sqliteDb.select().from(schema.sessions);
    console.log(`Found ${sessions.length} sessions`);

    for (const session of sessions) {
      const s = session as any;
      await pgDb.insert(pgSchema.sessions).values({
        id: session.id,
        userId: session.userId,
        expires: s.expiresAt || session.expires, // Map old to new field name
        sessionToken: s.token || session.sessionToken, // Map old to new field name
      }).onConflictDoNothing();
    }

    // Migrate accounts
    console.log("Migrating accounts...");
    const accounts = await sqliteDb.select().from(schema.accounts);
    console.log(`Found ${accounts.length} accounts`);

    for (const account of accounts) {
      const a = account as any;
      await pgDb.insert(pgSchema.accounts).values({
        id: account.id,
        userId: account.userId,
        provider: a.providerId || account.provider, // Map old to new field name
        providerAccountId: a.accountId || account.providerAccountId, // Map old to new field name
        access_token: a.accessToken || account.access_token, // Map old to new field name
        refresh_token: a.refreshToken || account.refresh_token, // Map old to new field name
        id_token: a.idToken || account.id_token, // Map old to new field name
        expires_at: a.expiresAt || account.expires_at, // Map old to new field name
      }).onConflictDoNothing();
    }

    // Migrate projects
    console.log("Migrating projects...");
    const projects = await sqliteDb.select().from(schema.projects);
    console.log(`Found ${projects.length} projects`);

    for (const project of projects) {
      await pgDb.insert(pgSchema.projects).values({
        id: project.id,
        userId: project.userId,
        title: project.title,
        initialIdea: project.initialIdea,
        answers: project.answers,
        techMode: project.techMode,
        stack: project.stack,
        generatedPrd: project.generatedPrd,
        status: project.status,
        tier: project.tier,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }).onConflictDoNothing();
    }

    // Migrate project messages
    console.log("Migrating project messages...");
    const messages = await sqliteDb.select().from(schema.projectMessages);
    console.log(`Found ${messages.length} messages`);

    for (const message of messages) {
      await pgDb.insert(pgSchema.projectMessages).values({
        id: message.id,
        projectId: message.projectId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      }).onConflictDoNothing();
    }

    // Migrate usage quotas
    console.log("Migrating usage quotas...");
    const quotas = await sqliteDb.select().from(schema.usageQuotas);
    console.log(`Found ${quotas.length} usage quotas`);

    for (const quota of quotas) {
      await pgDb.insert(pgSchema.usageQuotas).values({
        id: quota.id,
        userId: quota.userId,
        month: quota.month,
        prdCount: quota.prdCount,
        chatCount: quota.chatCount,
        createdAt: quota.createdAt,
        updatedAt: quota.updatedAt,
      }).onConflictDoNothing();
    }

    // Migrate notifications
    console.log("Migrating notifications...");
    const notifications = await sqliteDb.select().from(schema.notifications);
    console.log(`Found ${notifications.length} notifications`);

    for (const notification of notifications) {
      await pgDb.insert(pgSchema.notifications).values({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
        read: notification.read,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      }).onConflictDoNothing();
    }

    console.log("✅ Migration completed successfully!");
    console.log("Remember to set DATABASE_PROVIDER=postgresql in your environment");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

migrate();
