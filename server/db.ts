import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync, type SQLOutputValue } from "node:sqlite";
import {
  MEMBERSHIP_STATUSES,
  type Member,
  type MembershipStatus,
  type PasswordResetTokenRecord,
  type UserRecord,
} from "./types.ts";

const DEFAULT_DB_PATH = path.resolve("data", "bana-ba-sawa.db");

function asString(value: SQLOutputValue | undefined): string {
  if (value == null) return "";
  return String(value);
}

function asNumber(value: SQLOutputValue | undefined): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return Number(value ?? 0);
}

function asStatus(value: SQLOutputValue | undefined): MembershipStatus {
  const status = asString(value);
  if ((MEMBERSHIP_STATUSES as readonly string[]).includes(status)) {
    return status as MembershipStatus;
  }
  return "pending";
}

function mapUser(row: Record<string, SQLOutputValue>): UserRecord {
  return {
    id: asNumber(row.id),
    email: asString(row.email),
    passwordHash: asString(row.password_hash),
    firstName: asString(row.first_name),
    lastName: asString(row.last_name),
    phone: asString(row.phone),
    city: asString(row.city),
    postcode: asString(row.postcode),
    heritageNotes: asString(row.heritage_notes),
    membershipStatus: asStatus(row.membership_status),
    membershipNumber: asString(row.membership_number),
    eligibilityConfirmed: asNumber(row.eligibility_confirmed) === 1,
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  };
}

export function toPublicMember(user: UserRecord): Member {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    city: user.city,
    postcode: user.postcode,
    heritageNotes: user.heritageNotes,
    membershipStatus: user.membershipStatus,
    membershipNumber: user.membershipNumber,
    eligibilityConfirmed: user.eligibilityConfirmed,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function createDatabase(databasePath = process.env.DATABASE_PATH || DEFAULT_DB_PATH): DatabaseSync {
  if (databasePath !== ":memory:") {
    mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  }
  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      postcode TEXT NOT NULL DEFAULT '',
      heritage_notes TEXT NOT NULL DEFAULT '',
      membership_status TEXT NOT NULL DEFAULT 'pending',
      membership_number TEXT NOT NULL UNIQUE,
      eligibility_confirmed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_hash ON password_reset_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id);
  `);
  return db;
}

export function createMemberNumber(id: number, createdAt: string): string {
  const year = createdAt.slice(0, 4) || String(new Date().getFullYear());
  return `BBS-${year}-${String(id).padStart(4, "0")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function findUserByEmail(db: DatabaseSync, email: string): UserRecord | undefined {
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  return row ? mapUser(row) : undefined;
}

export function findUserById(db: DatabaseSync, id: number): UserRecord | undefined {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? mapUser(row) : undefined;
}

export function insertUser(
  db: DatabaseSync,
  values: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    postcode: string;
    heritageNotes: string;
    eligibilityConfirmed: boolean;
  },
): UserRecord {
  const timestamp = nowIso();
  const placeholderNumber = `TMP-${crypto.randomUUID()}`;
  const result = db.prepare(
    `INSERT INTO users (
      email, password_hash, first_name, last_name, phone, city, postcode,
      heritage_notes, membership_status, membership_number, eligibility_confirmed,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
  ).run(
    values.email,
    values.passwordHash,
    values.firstName,
    values.lastName,
    values.phone,
    values.city,
    values.postcode,
    values.heritageNotes,
    placeholderNumber,
    values.eligibilityConfirmed ? 1 : 0,
    timestamp,
    timestamp,
  );

  const id = Number(result.lastInsertRowid);
  const membershipNumber = createMemberNumber(id, timestamp);
  db.prepare("UPDATE users SET membership_number = ? WHERE id = ?").run(membershipNumber, id);

  const user = findUserById(db, id);
  if (!user) {
    throw new Error("Failed to load the newly created member.");
  }
  return user;
}

export function updateUser(
  db: DatabaseSync,
  id: number,
  values: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    postcode: string;
    heritageNotes: string;
    passwordHash?: string;
  },
): UserRecord {
  const timestamp = nowIso();
  if (values.passwordHash) {
    db.prepare(
      `UPDATE users SET
        email = ?, first_name = ?, last_name = ?, phone = ?, city = ?,
        postcode = ?, heritage_notes = ?, password_hash = ?, updated_at = ?
      WHERE id = ?`,
    ).run(
      values.email,
      values.firstName,
      values.lastName,
      values.phone,
      values.city,
      values.postcode,
      values.heritageNotes,
      values.passwordHash,
      timestamp,
      id,
    );
  } else {
    db.prepare(
      `UPDATE users SET
        email = ?, first_name = ?, last_name = ?, phone = ?, city = ?,
        postcode = ?, heritage_notes = ?, updated_at = ?
      WHERE id = ?`,
    ).run(
      values.email,
      values.firstName,
      values.lastName,
      values.phone,
      values.city,
      values.postcode,
      values.heritageNotes,
      timestamp,
      id,
    );
  }

  const user = findUserById(db, id);
  if (!user) {
    throw new Error("Member record could not be updated.");
  }
  return user;
}

export function createSession(db: DatabaseSync, userId: number, sessionId: string, expiresAt: string): void {
  db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
    sessionId,
    userId,
    expiresAt,
    nowIso(),
  );
}

export function findValidSession(
  db: DatabaseSync,
  sessionId: string,
): { user: UserRecord; expiresAt: string } | undefined {
  const row = db
    .prepare(
      `SELECT users.*, sessions.expires_at AS session_expires_at
       FROM sessions
       INNER JOIN users ON users.id = sessions.user_id
       WHERE sessions.id = ?`,
    )
    .get(sessionId);

  if (!row) return undefined;
  if (asString(row.session_expires_at) <= nowIso()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return undefined;
  }

  return {
    user: mapUser(row),
    expiresAt: asString(row.session_expires_at),
  };
}

export function deleteSession(db: DatabaseSync, sessionId: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function deleteExpiredSessions(db: DatabaseSync): void {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso());
}

export function deleteSessionsForUser(db: DatabaseSync, userId: number): void {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function updatePasswordHash(db: DatabaseSync, userId: number, passwordHash: string): void {
  db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
    passwordHash,
    nowIso(),
    userId,
  );
}

function mapResetToken(row: Record<string, SQLOutputValue>): PasswordResetTokenRecord {
  return {
    id: asNumber(row.id),
    userId: asNumber(row.user_id),
    tokenHash: asString(row.token_hash),
    expiresAt: asString(row.expires_at),
    usedAt: row.used_at == null ? null : asString(row.used_at),
    createdAt: asString(row.created_at),
  };
}

export function insertPasswordResetToken(
  db: DatabaseSync,
  values: { userId: number; tokenHash: string; expiresAt: string },
): number {
  const result = db
    .prepare(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
       VALUES (?, ?, ?, NULL, ?)`,
    )
    .run(values.userId, values.tokenHash, values.expiresAt, nowIso());
  return Number(result.lastInsertRowid);
}

export function findPasswordResetTokenByHash(
  db: DatabaseSync,
  tokenHash: string,
): PasswordResetTokenRecord | undefined {
  const row = db.prepare("SELECT * FROM password_reset_tokens WHERE token_hash = ?").get(tokenHash);
  return row ? mapResetToken(row) : undefined;
}

export function markPasswordResetTokenUsed(db: DatabaseSync, id: number): void {
  db.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL").run(nowIso(), id);
}

export function invalidatePasswordResetTokensForUser(db: DatabaseSync, userId: number): void {
  db.prepare(
    "UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
  ).run(nowIso(), userId);
}

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && /unique/i.test(error.message);
}
