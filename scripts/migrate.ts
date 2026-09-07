import "dotenv/config";
import { createPgPool } from "../server/db-postgres.js";
import { migratePostgres } from "../server/migrate.js";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is required to run production migrations.");
  process.exit(1);
}

const pool = createPgPool(connectionString);
await migratePostgres(pool);
await pool.end();
console.log("Production migrations are up to date.");
