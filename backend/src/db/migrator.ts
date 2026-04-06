import fs from "node:fs/promises";
import path from "node:path";

import { PoolClient } from "pg";

import { pool } from "./client";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "migrations");
const RLS_SQL_PATH = path.resolve(process.cwd(), "src", "db", "rls.sql");

function formatSqlError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage = "message" in error ? String(error.message) : "";
    const maybeDetail = "detail" in error ? String(error.detail) : "";
    const maybeHint = "hint" in error ? String(error.hint) : "";
    const maybeCode = "code" in error ? String(error.code) : "";

    const parts = [
      maybeMessage.trim(),
      maybeDetail.trim(),
      maybeHint.trim(),
      maybeCode.trim().length > 0 ? `code=${maybeCode.trim()}` : "",
    ].filter((part) => part.length > 0);

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return String(error);
}

async function runSqlInTransaction(sql: string): Promise<void> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<void> {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  const migrationFiles = entries
    .filter((fileName) => /^\d+_.+\.sql$/.test(fileName))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  for (const fileName of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, fileName);

    try {
      const sql = await fs.readFile(filePath, "utf8");
      await runSqlInTransaction(sql);
      console.log(`${new Date().toISOString()} [MIGRATED] ${fileName}`);
    } catch (error) {
      const sqlErrorMessage = formatSqlError(error);
      console.error(`Migration failed for ${fileName}: ${sqlErrorMessage}`);
      throw new Error(`Migration failed for ${fileName}: ${sqlErrorMessage}`);
    }
  }
}

export async function applyRlsPolicies(): Promise<void> {
  try {
    const sql = await fs.readFile(RLS_SQL_PATH, "utf8");
    await runSqlInTransaction(sql);
    console.log("[RLS] Applied RLS policies from src/db/rls.sql");
  } catch (error) {
    const sqlErrorMessage = formatSqlError(error);
    throw new Error(`Failed to apply RLS policies: ${sqlErrorMessage}`);
  }
}
