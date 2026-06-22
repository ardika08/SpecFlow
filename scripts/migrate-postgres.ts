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
  const sql = neon(postgresUrl);
  const pgDb = drizzleNeon(sql, { schema });

  try {
    // Migrate users
    console.log("Migrating users...");
    const users = await sqliteDb.select().from(schema.users);
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      await pgDb.insert(schema.users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        passwordHash: user.passwordHash,
        avatar: user.avatar,
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
      await pgDb.insert(schema.sessions).values({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        token: session.token,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }).onConflictDoNothing();
    }

    // Migrate accounts
    console.log("Migrating accounts...");
    const accounts = await sqliteDb.select().from(schema.accounts);
    console.log(`Found ${accounts.length} accounts`);

    for (const account of accounts) {
      await pgDb.insert(schema.accounts).values({
        id: account.id,
        userId: account.userId,
        accountId: account.accountId,
        providerId: account.providerId,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        idToken: account.idToken,
        expiresAt: account.expiresAt,
        password: account.password,
        passwordHash: account.passwordHash,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }).onConflictDoNothing();
    }

    // Migrate projects
    console.log("Migrating projects...");
    const projects = await sqliteDb.select().from(schema.projects);
    console.log(`Found ${projects.length} projects`);

    for (const project of projects) {
      await pgDb.insert(schema.projects).values({
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
      await pgDb.insert(schema.projectMessages).values({
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
      await pgDb.insert(schema.usageQuotas).values({
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
      await pgDb.insert(schema.notifications).values({
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
