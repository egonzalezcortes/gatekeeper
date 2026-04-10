import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { pool } from "./db/client";
import { applyRlsPolicies, runMigrations } from "./db/migrator";
import { setupDatabaseRole } from "./db/setup";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

async function start(): Promise<void> {
  try {
    console.log("[App] Starting Gatekeeper...");

    await runMigrations();
    console.log("[DB] Migrations complete");

    await applyRlsPolicies();
    console.log("[DB] RLS policies applied");

    await setupDatabaseRole();
    console.log("[DB] App database role setup complete");

    app.listen(port, () => {
      console.log(`[App] Server listening on port ${port}`);
    });

    process.on("SIGTERM", async () => {
      console.log("[App] Received SIGTERM, shutting down gracefully...");
      await pool.end();
      process.exit(0);
    });
  } catch (error) {
    console.error("[App] Failed to start:", error);
    process.exit(1);
  }
}

void start();
