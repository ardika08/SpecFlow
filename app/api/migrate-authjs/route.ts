import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/pg-adapter";

export async function GET(req: NextRequest) {
  // Gate: hanya boleh dijalankan dengan secret yang benar.
  // Set MIGRATION_SECRET di environment, lalu panggil:
  //   /api/migrate-authjs?secret=XXXX  atau header x-migration-secret
  const secret =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-migration-secret");
  if (!process.env.MIGRATION_SECRET || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results: string[] = [];

    // 1. Cek jumlah user lama (aman kalau tabel belum ada)
    try {
      const existingUsers = await db.execute(`SELECT COUNT(*) as count FROM users;`);
      results.push(`Existing users: ${existingUsers.rows[0].count}`);
    } catch {
      results.push("Tabel users belum ada (fresh database)");
    }

    // 2. Drop old tables (CASCADE untuk drop dependencies)
    await db.execute(`DROP TABLE IF EXISTS project_messages CASCADE;`);
    results.push("Dropped project_messages");

    await db.execute(`DROP TABLE IF EXISTS projects CASCADE;`);
    results.push("Dropped projects");

    await db.execute(`DROP TABLE IF EXISTS usage_quotas CASCADE;`);
    results.push("Dropped usage_quotas");

    await db.execute(`DROP TABLE IF EXISTS notifications CASCADE;`);
    results.push("Dropped notifications");

    await db.execute(`DROP TABLE IF EXISTS verification CASCADE;`);
    results.push("Dropped old verification table");

    await db.execute(`DROP TABLE IF EXISTS verification_tokens CASCADE;`);
    results.push("Dropped verification_tokens");

    await db.execute(`DROP TABLE IF EXISTS accounts CASCADE;`);
    results.push("Dropped accounts");

    await db.execute(`DROP TABLE IF EXISTS sessions CASCADE;`);
    results.push("Dropped sessions");

    await db.execute(`DROP TABLE IF EXISTS users CASCADE;`);
    results.push("Dropped users");

    // 3. Create Auth.js v5 tables

    // Users table
    await db.execute(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified TIMESTAMP,
        image TEXT,
        phone TEXT,
        password_hash TEXT,
        tier TEXT NOT NULL DEFAULT 'Freemium',
        current_period_end TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    results.push("Created users table");

    // Accounts table
    await db.execute(`
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, provider_account_id)
      );
    `);
    results.push("Created accounts table");

    // Sessions table
    await db.execute(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL,
        session_token TEXT NOT NULL UNIQUE
      );
    `);
    results.push("Created sessions table");

    // Verification tokens table
    await db.execute(`
      CREATE TABLE verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires TIMESTAMP NOT NULL
      );
    `);
    results.push("Created verification_tokens table");

    // 4. Recreate SpecFlow business tables

    await db.execute(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        initial_idea TEXT NOT NULL,
        answers TEXT,
        tech_mode TEXT NOT NULL DEFAULT 'auto',
        stack TEXT,
        generated_prd TEXT,
        status TEXT NOT NULL DEFAULT 'Draft',
        tier TEXT NOT NULL DEFAULT 'Freemium',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    results.push("Created projects table");

    await db.execute(`
      CREATE TABLE project_messages (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    results.push("Created project_messages table");

    await db.execute(`
      CREATE TABLE usage_quotas (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        month TEXT NOT NULL,
        prd_count INTEGER NOT NULL DEFAULT 0,
        chat_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    results.push("Created usage_quotas table");

    await db.execute(`
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        action_url TEXT,
        action_label TEXT,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        metadata TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    results.push("Created notifications table");

    // 5. Create indexes for performance
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
    results.push("Created indexes");

    return NextResponse.json({
      success: true,
      message: "Migration to Auth.js v5 schema completed successfully",
      results,
    });
  } catch (error: unknown) {
    console.error("Migration error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
