import type { AppDatabase } from "./db-types.js";

export async function bootstrapFirstAdmin(
  db: AppDatabase,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ promoted: boolean; reason: string }> {
  const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    return { promoted: false, reason: "BOOTSTRAP_ADMIN_EMAIL is not set." };
  }

  const adminCount = await db.countUsersByRole("admin");
  const user = await db.findUserByEmail(email);

  if (user?.role === "admin") {
    return { promoted: false, reason: "That account is already an admin." };
  }

  if (adminCount > 0) {
    return {
      promoted: false,
      reason: "An admin already exists. Promote further admins from an authenticated admin session.",
    };
  }

  if (!user) {
    return {
      promoted: false,
      reason: "BOOTSTRAP_ADMIN_EMAIL is set but no matching member account exists yet.",
    };
  }

  await db.updateUserRole(user.id, "admin");
  console.log(`[admin] Promoted ${email} to admin (first-admin bootstrap).`);
  return { promoted: true, reason: `Promoted ${email} to admin.` };
}
