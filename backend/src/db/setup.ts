import fs from "node:fs/promises";
import path from "node:path";

import { pool } from "./client";

// Path is relative to the working directory where Node is started.
// In Docker, the working directory is /app/backend, so this resolves correctly.
// If running from the repo root, this path will fail — ensure npm scripts
// are run from the backend directory. This is addressed in Step 17 (Docker setup).
const SETUP_SQL_PATH = path.resolve(process.cwd(), "src", "db", "setup-db-role.sql");

export async function setupDatabaseRole(): Promise<void> {
  const password = process.env.DB_APP_PASSWORD;

  if (!password) {
    throw new Error("DB_APP_PASSWORD environment variable is not set");
  }

  try {
    await pool.query(`
      DO $$ BEGIN
        CREATE ROLE gatekeeper_app WITH LOGIN NOSUPERUSER;
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $$;
    `);

    await pool.query(
      "ALTER ROLE gatekeeper_app WITH PASSWORD $1",
      [password],
    );

    const sql = await fs.readFile(SETUP_SQL_PATH, "utf8");
    await pool.query(sql);

    console.log("[DB] Database role setup complete");
  } catch (error) {
    console.error("[DB] Failed to set up database role:", error);
    throw error;
  }
}
