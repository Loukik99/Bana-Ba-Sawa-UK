import type { Pool, PoolClient } from "pg";
import { hashSecretToken } from "./crypto.js";
import { POSTGRES_MIGRATIONS } from "./migrations.js";

export async function migratePostgres(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const migration of POSTGRES_MIGRATIONS) {
    const applied = await pool.query("SELECT 1 FROM schema_migrations WHERE id = $1", [migration.id]);
    if (applied.rowCount) continue;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await runSqlBatch(client, migration.sql);
      await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
      await client.query("COMMIT");
      console.log(`Applied migration ${migration.id}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  await hashExistingSessionIds(pool);
}

async function hashExistingSessionIds(pool: Pool): Promise<void> {
  const applied = await pool.query("SELECT 1 FROM schema_migrations WHERE id = $1", ["002_hash_session_ids"]);
  if (applied.rowCount) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ id: string }>("SELECT id FROM sessions");
    for (const row of result.rows) {
      await client.query("UPDATE sessions SET id = $1 WHERE id = $2", [hashSecretToken(row.id), row.id]);
    }
    await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", ["002_hash_session_ids"]);
    await client.query("COMMIT");
    console.log("Applied migration 002_hash_session_ids");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function stripSqlComments(sql: string): string {
  return sql
    .split("\n")
    .map((line) => (line.trim().startsWith("--") ? "" : line))
    .join("\n");
}

function isIgnorableIdempotentError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  const code = (error as { code?: string }).code;
  return code === "42710" || code === "42P07" || code === "42701";
}

function runSqlBatch(client: PoolClient, sql: string): Promise<unknown> {
  const statements = stripSqlComments(sql)
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  return statements.reduce<Promise<unknown>>(
    (previous, statement) =>
      previous.then(async () => {
        try {
          await client.query(statement);
        } catch (error) {
          if (isIgnorableIdempotentError(error)) return;
          throw error;
        }
      }),
    Promise.resolve(),
  );
}
