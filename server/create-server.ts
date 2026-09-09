import "dotenv/config";
import { validateProductionConfig } from "./config.js";
import { createApp } from "./app.js";
import { createDatabase, type AppDatabase } from "./db.js";

export async function createServer(): Promise<{ app: ReturnType<typeof createApp>; db: AppDatabase }> {
  validateProductionConfig();
  const db = await createDatabase();
  return { app: createApp(db), db };
}
