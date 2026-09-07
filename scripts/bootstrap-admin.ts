import "dotenv/config";
import { createDatabase } from "../server/db.js";
import { bootstrapFirstAdmin } from "../server/admin-bootstrap.js";

const db = await createDatabase();
try {
  const result = await bootstrapFirstAdmin(db);
  if (result.promoted) {
    console.log(result.reason);
    process.exit(0);
  }

  console.error(result.reason);
  process.exit(result.reason.includes("already an admin") ? 0 : 1);
} finally {
  await db.close();
}
