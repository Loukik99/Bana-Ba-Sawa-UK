import { hashPassword } from "./auth.js";
import type { AppDatabase } from "./db-types.js";
import type { UserRecord } from "./types.js";

export interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
  promoteIfExists?: boolean;
}

export type CreateAdminResult =
  | { status: "created"; email: string; role: "admin" }
  | { status: "promoted"; email: string; role: "admin" }
  | { status: "already_admin"; email: string; role: "admin" }
  | { status: "exists_member"; email: string; role: "member" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function splitAdminName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    throw new Error("Please enter a name.");
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function normalizeAdminEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (!value || value.length > 254 || !EMAIL_PATTERN.test(value)) {
    throw new Error("Please enter a valid email.");
  }
  return value;
}

export function validateAdminPassword(password: string): string {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (password.length > 72) {
    throw new Error("Password is too long.");
  }
  return password;
}

export function formatAdminCreatedMessage(email: string): string {
  return `Admin account created successfully\nEmail: ${email}\nRole: admin`;
}

export function formatAdminPromotedMessage(email: string): string {
  return `Existing account promoted to admin\nEmail: ${email}\nRole: admin`;
}

export async function createAdminAccount(db: AppDatabase, input: CreateAdminInput): Promise<CreateAdminResult> {
  const email = normalizeAdminEmail(input.email);
  const existing = await db.findUserByEmail(email);

  if (existing?.role === "admin") {
    return { status: "already_admin", email, role: "admin" };
  }

  if (existing) {
    if (!input.promoteIfExists) {
      return { status: "exists_member", email, role: "member" };
    }
    await db.updateUserRole(existing.id, "admin");
    return { status: "promoted", email, role: "admin" };
  }

  const password = validateAdminPassword(input.password);
  const { firstName, lastName } = splitAdminName(input.name);
  const passwordHash = await hashPassword(password);

  const user = await insertAdminUser(db, {
    email,
    passwordHash,
    firstName,
    lastName,
  });

  if (user.role !== "admin") {
    throw new Error("Failed to create the admin account.");
  }

  return { status: "created", email: user.email, role: "admin" };
}

async function insertAdminUser(
  db: AppDatabase,
  values: { email: string; passwordHash: string; firstName: string; lastName: string },
): Promise<UserRecord> {
  return db.insertUser({
    email: values.email,
    passwordHash: values.passwordHash,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: "",
    city: "",
    postcode: "",
    heritageNotes: "",
    eligibilityConfirmed: true,
    role: "admin",
  });
}
