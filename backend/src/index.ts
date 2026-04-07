import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { applyRlsPolicies, runMigrations } from "./db/migrator";

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
  await runMigrations();
  await applyRlsPolicies();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
