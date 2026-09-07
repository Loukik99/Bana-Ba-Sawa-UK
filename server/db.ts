import type { AppDatabase, InsertResetTokenValues, InsertUserValues, UpdateUserValues } from "./db-types.js";

export type { AppDatabase, InsertResetTokenValues, InsertUserValues, UpdateUserValues } from "./db-types.js";
export { UniqueConstraintError, createMemberNumber, isUniqueConstraintError, nowIso, toPublicMember } from "./db-shared.js";

function shouldUsePostgres(explicitSqlitePath?: string): boolean {
  if (explicitSqlitePath !== undefined) return false;
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function createDatabase(sqlitePath?: string): Promise<AppDatabase> {
  if (shouldUsePostgres(sqlitePath)) {
    const { createPostgresDatabase } = await import("./db-postgres.js");
    return createPostgresDatabase();
  }
  const { createSqliteDatabase } = await import("./db-sqlite.js");
  return createSqliteDatabase(sqlitePath);
}

export async function findUserByEmail(db: AppDatabase, email: string) {
  return db.findUserByEmail(email);
}

export async function findUserById(db: AppDatabase, id: number) {
  return db.findUserById(id);
}

export async function insertUser(db: AppDatabase, values: InsertUserValues) {
  return db.insertUser(values);
}

export async function updateUser(db: AppDatabase, id: number, values: UpdateUserValues) {
  return db.updateUser(id, values);
}

export async function createSession(db: AppDatabase, userId: number, sessionToken: string, expiresAt: string) {
  return db.createSession(userId, sessionToken, expiresAt);
}

export async function findValidSession(db: AppDatabase, sessionToken: string) {
  return db.findValidSession(sessionToken);
}

export async function deleteSession(db: AppDatabase, sessionToken: string) {
  return db.deleteSession(sessionToken);
}

export async function hasStoredSessionId(db: AppDatabase, storedId: string) {
  return db.hasStoredSessionId(storedId);
}

export async function deleteExpiredSessions(db: AppDatabase) {
  return db.deleteExpiredSessions();
}

export async function deleteSessionsForUser(db: AppDatabase, userId: number) {
  return db.deleteSessionsForUser(userId);
}

export async function updatePasswordHash(db: AppDatabase, userId: number, passwordHash: string) {
  return db.updatePasswordHash(userId, passwordHash);
}

export async function insertPasswordResetToken(db: AppDatabase, values: InsertResetTokenValues) {
  return db.insertPasswordResetToken(values);
}

export async function findPasswordResetTokenByHash(db: AppDatabase, tokenHash: string) {
  return db.findPasswordResetTokenByHash(tokenHash);
}

export async function markPasswordResetTokenUsed(db: AppDatabase, id: number) {
  return db.markPasswordResetTokenUsed(id);
}

export async function invalidatePasswordResetTokensForUser(db: AppDatabase, userId: number) {
  return db.invalidatePasswordResetTokensForUser(userId);
}
