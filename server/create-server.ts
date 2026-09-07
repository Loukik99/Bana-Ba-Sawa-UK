import "dotenv/config";
import { validateProductionConfig } from "./config.js";
import { createApp } from "./app.js";
import { bootstrapFirstAdmin } from "./admin-bootstrap.js";
import { createDatabase, type AppDatabase } from "./db.js";

export async function createServer(): Promise<{ app: ReturnType<typeof createApp>; db: AppDatabase }> {
  validateProductionConfig();
  const db = await createDatabase();
  const bootstrap = await bootstrapFirstAdmin(db);
  if (!bootstrap.promoted && process.env.BOOTSTRAP_ADMIN_EMAIL?.trim() && bootstrap.reason.includes("no matching member")) {
    console.warn(`[admin] ${bootstrap.reason}`);
  }
  return { app: createApp(db), db };
}
