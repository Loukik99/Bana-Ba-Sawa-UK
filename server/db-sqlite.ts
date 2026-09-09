import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashSecretToken, isSecretTokenFormat } from "./crypto.js";
import type {
  AppDatabase,
  EventListQuery,
  InsertEventValues,
  InsertNewsValues,
  InsertNotificationValues,
  InsertResetTokenValues,
  InsertUserValues,
  InsertVerificationTokenValues,
  MemberListQuery,
  NewsListQuery,
  UpdateEventValues,
  UpdateNewsValues,
  UpdateUserValues,
} from "./db-types.js";
import type { MembershipStatus, UserRole } from "./types.js";
import {
  UniqueConstraintError,
  asIso,
  createMemberNumber,
  mapEvent,
  mapEventNotification,
  mapNews,
  mapResetToken,
  mapUser,
  mapVerificationToken,
  nowIso,
} from "./db-shared.js";

const DEFAULT_DB_PATH = path.resolve("data", "bana-ba-sawa.db");

type SqlParam = string | number | null;

function asRow(row: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  return row;
}

function throwIfUnique(error: unknown): never {
  if (error instanceof Error && /unique/i.test(error.message)) {
    throw new UniqueConstraintError();
  }
  throw error;
}

function addColumnIfMissing(db: DatabaseSync, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((entry) => entry.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function migrateSqliteSessions(db: DatabaseSync): void {
  const usersExist = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  const applied001 = db.prepare("SELECT 1 FROM schema_migrations WHERE id = ?").get("001_init");
  if (usersExist && !applied001) {
    db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)").run("001_init", nowIso());
  }

  const applied002 = db.prepare("SELECT 1 FROM schema_migrations WHERE id = ?").get("002_hash_session_ids");
  if (applied002) return;

  db.exec("BEGIN");
  try {
    const rows = db.prepare("SELECT id FROM sessions").all() as Array<{ id: string }>;
    const update = db.prepare("UPDATE sessions SET id = ? WHERE id = ?");
    for (const row of rows) {
      update.run(hashSecretToken(row.id), row.id);
    }
    db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)").run("002_hash_session_ids", nowIso());
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function migrateSqlitePhase3(db: DatabaseSync): void {
  const applied = db.prepare("SELECT 1 FROM schema_migrations WHERE id = ?").get("003_phase3");
  if (applied) return;

  db.exec("BEGIN");
  try {
    addColumnIfMissing(db, "users", "role", "TEXT NOT NULL DEFAULT 'member'");
    addColumnIfMissing(db, "users", "email_verified_at", "TEXT");
    addColumnIfMissing(db, "users", "welcome_email_sent_at", "TEXT");
    db.prepare("UPDATE users SET membership_status = 'suspended' WHERE membership_status = 'inactive'").run();

    db.exec(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_verification_tokens_hash ON email_verification_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON email_verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_membership_status ON users(membership_status);
      CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON users(email_verified_at);

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        event_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        location TEXT NOT NULL DEFAULT '',
        event_url TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        published_at TEXT,
        created_by INTEGER NOT NULL,
        notified_at TEXT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
      CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
      CREATE INDEX IF NOT EXISTS idx_events_published_at ON events(published_at);
      CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
      CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

      CREATE TABLE IF NOT EXISTS news_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL DEFAULT 'news',
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        summary TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        published_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_news_status ON news_items(status);
      CREATE INDEX IF NOT EXISTS idx_news_kind ON news_items(kind);
      CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_items(published_at);
      CREATE INDEX IF NOT EXISTS idx_news_created_by ON news_items(created_by);
      CREATE INDEX IF NOT EXISTS idx_news_slug ON news_items(slug);

      CREATE TABLE IF NOT EXISTS event_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        sent_at TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (event_id, user_id)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_event_notifications_event_id ON event_notifications(event_id);
      CREATE INDEX IF NOT EXISTS idx_event_notifications_user_id ON event_notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_event_notifications_status ON event_notifications(status);
    `);

    db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)").run("003_phase3", nowIso());
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function searchLike(value: string): string {
  return `%${value.replaceAll("\\", "").replaceAll("%", "").replaceAll("_", "")}%`;
}

export function createSqliteDatabase(databasePath = process.env.DATABASE_PATH || DEFAULT_DB_PATH): AppDatabase {
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

    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);

  migrateSqliteSessions(db);
  migrateSqlitePhase3(db);

  const sqlite: AppDatabase = {
    kind: "sqlite",

    async healthCheck() {
      db.prepare("SELECT 1").get();
    },

    async findUserByEmail(email: string) {
      const row = asRow(db.prepare("SELECT * FROM users WHERE email = ?").get(email) as Record<string, unknown> | undefined);
      return row ? mapUser(row) : undefined;
    },

    async findUserById(id: number) {
      const row = asRow(db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined);
      return row ? mapUser(row) : undefined;
    },

    async insertUser(values: InsertUserValues) {
      const timestamp = nowIso();
      const placeholderNumber = `TMP-${crypto.randomUUID()}`;
      try {
        const result = db.prepare(
          `INSERT INTO users (
            email, password_hash, first_name, last_name, phone, city, postcode,
            heritage_notes, membership_status, membership_number, eligibility_confirmed,
            role, email_verified_at, welcome_email_sent_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, NULL, NULL, ?, ?)`,
        ).run(
          values.email,
          values.passwordHash,
          values.firstName,
          values.lastName,
          values.phone ?? "",
          values.city ?? "",
          values.postcode ?? "",
          values.heritageNotes ?? "",
          placeholderNumber,
          values.eligibilityConfirmed ? 1 : 0,
          values.role ?? "member",
          timestamp,
          timestamp,
        );

        const id = Number(result.lastInsertRowid);
        const membershipNumber = createMemberNumber(id, timestamp);
        db.prepare("UPDATE users SET membership_number = ? WHERE id = ?").run(membershipNumber, id);

        const user = await sqlite.findUserById(id);
        if (!user) {
          throw new Error("Failed to load the newly created member.");
        }
        return user;
      } catch (error) {
        throwIfUnique(error);
      }
    },

    async updateUser(id: number, values: UpdateUserValues) {
      const timestamp = nowIso();
      try {
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
      } catch (error) {
        throwIfUnique(error);
      }

      const user = await sqlite.findUserById(id);
      if (!user) {
        throw new Error("Member record could not be updated.");
      }
      return user;
    },

    async updateUserMembershipStatus(id, status: MembershipStatus) {
      db.prepare("UPDATE users SET membership_status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), id);
      const user = await sqlite.findUserById(id);
      if (!user) throw new Error("Member record could not be updated.");
      return user;
    },

    async updateUserRole(id, role: UserRole) {
      db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").run(role, nowIso(), id);
      const user = await sqlite.findUserById(id);
      if (!user) throw new Error("Member record could not be updated.");
      return user;
    },

    async markEmailVerified(id) {
      const timestamp = nowIso();
      db.prepare("UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ? AND email_verified_at IS NULL").run(
        timestamp,
        timestamp,
        id,
      );
      const user = await sqlite.findUserById(id);
      if (!user) throw new Error("Member record could not be updated.");
      return user;
    },

    async clearEmailVerified(id) {
      db.prepare("UPDATE users SET email_verified_at = NULL, updated_at = ? WHERE id = ?").run(nowIso(), id);
    },

    async markWelcomeEmailSent(id) {
      const timestamp = nowIso();
      const result = db
        .prepare("UPDATE users SET welcome_email_sent_at = ?, updated_at = ? WHERE id = ? AND welcome_email_sent_at IS NULL")
        .run(timestamp, timestamp, id);
      return Number(result.changes) > 0;
    },

    async countUsersByRole(role) {
      const row = db.prepare("SELECT COUNT(*) AS total FROM users WHERE role = ?").get(role) as { total: number };
      return Number(row.total);
    },

    async listMembers(query: MemberListQuery) {
      const clauses: string[] = [];
      const params: SqlParam[] = [];
      if (query.status) {
        clauses.push("membership_status = ?");
        params.push(query.status);
      }
      if (query.search) {
        const like = searchLike(query.search);
        clauses.push("(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR membership_number LIKE ?)");
        params.push(like, like, like, like);
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const totalRow = db.prepare(`SELECT COUNT(*) AS total FROM users ${where}`).get(...params) as { total: number };
      const rows = db
        .prepare(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .all(...params, query.pageSize, query.offset) as Record<string, unknown>[];
      return { items: rows.map(mapUser), total: Number(totalRow.total) };
    },

    async listEligibleNotificationRecipients() {
      const rows = db
        .prepare(
          `SELECT * FROM users
           WHERE membership_status = 'active' AND email_verified_at IS NOT NULL`,
        )
        .all() as Record<string, unknown>[];
      return rows.map(mapUser);
    },

    async createSession(userId: number, sessionToken: string, expiresAt: string) {
      db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
        hashSecretToken(sessionToken),
        userId,
        expiresAt,
        nowIso(),
      );
    },

    async findValidSession(sessionToken: string) {
      if (!isSecretTokenFormat(sessionToken)) return undefined;
      const storedId = hashSecretToken(sessionToken);
      const row = asRow(
        db.prepare(
          `SELECT users.*, sessions.expires_at AS session_expires_at
           FROM sessions
           INNER JOIN users ON users.id = sessions.user_id
           WHERE sessions.id = ?`,
        ).get(storedId) as Record<string, unknown> | undefined,
      );

      if (!row) return undefined;
      if (asIso(row.session_expires_at) <= nowIso()) {
        db.prepare("DELETE FROM sessions WHERE id = ?").run(storedId);
        return undefined;
      }

      return {
        user: mapUser(row),
        expiresAt: asIso(row.session_expires_at),
      };
    },

    async deleteSession(sessionToken: string) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(hashSecretToken(sessionToken));
    },

    async hasStoredSessionId(storedId: string) {
      const row = db.prepare("SELECT 1 FROM sessions WHERE id = ?").get(storedId);
      return Boolean(row);
    },

    async deleteExpiredSessions() {
      db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso());
    },

    async deleteSessionsForUser(userId: number) {
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    },

    async updatePasswordHash(userId: number, passwordHash: string) {
      db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
        passwordHash,
        nowIso(),
        userId,
      );
    },

    async insertPasswordResetToken(values: InsertResetTokenValues) {
      const result = db
        .prepare(
          `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
           VALUES (?, ?, ?, NULL, ?)`,
        )
        .run(values.userId, values.tokenHash, values.expiresAt, nowIso());
      return Number(result.lastInsertRowid);
    },

    async findPasswordResetTokenByHash(tokenHash: string) {
      const row = asRow(
        db.prepare("SELECT * FROM password_reset_tokens WHERE token_hash = ?").get(tokenHash) as
          | Record<string, unknown>
          | undefined,
      );
      return row ? mapResetToken(row) : undefined;
    },

    async markPasswordResetTokenUsed(id: number) {
      db.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL").run(nowIso(), id);
    },

    async invalidatePasswordResetTokensForUser(userId: number) {
      db.prepare(
        "UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
      ).run(nowIso(), userId);
    },

    async insertEmailVerificationToken(values: InsertVerificationTokenValues) {
      const result = db
        .prepare(
          `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, used_at, created_at)
           VALUES (?, ?, ?, NULL, ?)`,
        )
        .run(values.userId, values.tokenHash, values.expiresAt, nowIso());
      return Number(result.lastInsertRowid);
    },

    async findEmailVerificationTokenByHash(tokenHash) {
      const row = asRow(
        db.prepare("SELECT * FROM email_verification_tokens WHERE token_hash = ?").get(tokenHash) as
          | Record<string, unknown>
          | undefined,
      );
      return row ? mapVerificationToken(row) : undefined;
    },

    async markEmailVerificationTokenUsed(id) {
      db.prepare("UPDATE email_verification_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL").run(nowIso(), id);
    },

    async invalidateEmailVerificationTokensForUser(userId) {
      db.prepare(
        "UPDATE email_verification_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
      ).run(nowIso(), userId);
    },

    async eventSlugExists(slug, excludeId) {
      const row = excludeId
        ? db.prepare("SELECT 1 FROM events WHERE slug = ? AND id != ?").get(slug, excludeId)
        : db.prepare("SELECT 1 FROM events WHERE slug = ?").get(slug);
      return Boolean(row);
    },

    async insertEvent(values: InsertEventValues) {
      const timestamp = nowIso();
      try {
        const result = db
          .prepare(
            `INSERT INTO events (
              title, slug, description, event_date, start_time, end_time, location, event_url,
              status, created_at, updated_at, published_at, created_by, notified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, NULL, ?, NULL)`,
          )
          .run(
            values.title,
            values.slug,
            values.description,
            values.eventDate,
            values.startTime,
            values.endTime,
            values.location,
            values.eventUrl,
            timestamp,
            timestamp,
            values.createdBy,
          );
        const event = await sqlite.findEventById(Number(result.lastInsertRowid));
        if (!event) throw new Error("Failed to load the newly created event.");
        return event;
      } catch (error) {
        throwIfUnique(error);
      }
    },

    async updateEvent(id, values: UpdateEventValues) {
      try {
        db.prepare(
          `UPDATE events SET
            title = ?, slug = ?, description = ?, event_date = ?, start_time = ?, end_time = ?,
            location = ?, event_url = ?, updated_at = ?
           WHERE id = ?`,
        ).run(
          values.title,
          values.slug,
          values.description,
          values.eventDate,
          values.startTime,
          values.endTime,
          values.location,
          values.eventUrl,
          nowIso(),
          id,
        );
      } catch (error) {
        throwIfUnique(error);
      }
      const event = await sqlite.findEventById(id);
      if (!event) throw new Error("Event record could not be updated.");
      return event;
    },

    async findEventById(id) {
      const row = asRow(db.prepare("SELECT * FROM events WHERE id = ?").get(id) as Record<string, unknown> | undefined);
      return row ? mapEvent(row) : undefined;
    },

    async findEventBySlug(slug) {
      const row = asRow(db.prepare("SELECT * FROM events WHERE slug = ?").get(slug) as Record<string, unknown> | undefined);
      return row ? mapEvent(row) : undefined;
    },

    async listPublishedEvents(query: EventListQuery) {
      const totalRow = db
        .prepare("SELECT COUNT(*) AS total FROM events WHERE status = 'published'")
        .get() as { total: number };
      const rows = db
        .prepare(
          `SELECT * FROM events WHERE status = 'published'
           ORDER BY event_date ASC, start_time ASC LIMIT ? OFFSET ?`,
        )
        .all(query.pageSize, query.offset) as Record<string, unknown>[];
      return { items: rows.map(mapEvent), total: Number(totalRow.total) };
    },

    async listAdminEvents(query: EventListQuery) {
      const clauses: string[] = [];
      const params: SqlParam[] = [];
      if (query.status) {
        clauses.push("status = ?");
        params.push(query.status);
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const totalRow = db.prepare(`SELECT COUNT(*) AS total FROM events ${where}`).get(...params) as { total: number };
      const rows = db
        .prepare(`SELECT * FROM events ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
        .all(...params, query.pageSize, query.offset) as Record<string, unknown>[];
      return { items: rows.map(mapEvent), total: Number(totalRow.total) };
    },

    async publishEvent(id) {
      const existing = await sqlite.findEventById(id);
      if (!existing) throw new Error("Event not found.");
      const timestamp = nowIso();
      db.prepare(
        `UPDATE events SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = ?
         WHERE id = ?`,
      ).run(timestamp, timestamp, id);
      const event = await sqlite.findEventById(id);
      if (!event) throw new Error("Event could not be published.");
      return event;
    },

    async archiveEvent(id) {
      db.prepare("UPDATE events SET status = 'archived', updated_at = ? WHERE id = ?").run(nowIso(), id);
      const event = await sqlite.findEventById(id);
      if (!event) throw new Error("Event could not be archived.");
      return event;
    },

    async markEventNotified(id) {
      db.prepare("UPDATE events SET notified_at = COALESCE(notified_at, ?), updated_at = ? WHERE id = ?").run(
        nowIso(),
        nowIso(),
        id,
      );
    },

    async newsSlugExists(slug, excludeId) {
      const row = excludeId
        ? db.prepare("SELECT 1 FROM news_items WHERE slug = ? AND id != ?").get(slug, excludeId)
        : db.prepare("SELECT 1 FROM news_items WHERE slug = ?").get(slug);
      return Boolean(row);
    },

    async insertNews(values: InsertNewsValues) {
      const timestamp = nowIso();
      try {
        const result = db
          .prepare(
            `INSERT INTO news_items (
              kind, title, slug, summary, content, status, published_at, created_at, updated_at, created_by
            ) VALUES (?, ?, ?, ?, ?, 'draft', NULL, ?, ?, ?)`,
          )
          .run(
            values.kind,
            values.title,
            values.slug,
            values.summary,
            values.content,
            timestamp,
            timestamp,
            values.createdBy,
          );
        const item = await sqlite.findNewsById(Number(result.lastInsertRowid));
        if (!item) throw new Error("Failed to load the newly created news item.");
        return item;
      } catch (error) {
        throwIfUnique(error);
      }
    },

    async updateNews(id, values: UpdateNewsValues) {
      try {
        db.prepare(
          `UPDATE news_items SET
            kind = ?, title = ?, slug = ?, summary = ?, content = ?, updated_at = ?
           WHERE id = ?`,
        ).run(values.kind, values.title, values.slug, values.summary, values.content, nowIso(), id);
      } catch (error) {
        throwIfUnique(error);
      }
      const item = await sqlite.findNewsById(id);
      if (!item) throw new Error("News item could not be updated.");
      return item;
    },

    async findNewsById(id) {
      const row = asRow(db.prepare("SELECT * FROM news_items WHERE id = ?").get(id) as Record<string, unknown> | undefined);
      return row ? mapNews(row) : undefined;
    },

    async findNewsBySlug(slug) {
      const row = asRow(
        db.prepare("SELECT * FROM news_items WHERE slug = ?").get(slug) as Record<string, unknown> | undefined,
      );
      return row ? mapNews(row) : undefined;
    },

    async listPublishedNews(query: NewsListQuery) {
      const clauses = ["status = 'published'"];
      const params: SqlParam[] = [];
      if (query.kind) {
        clauses.push("kind = ?");
        params.push(query.kind);
      }
      const where = `WHERE ${clauses.join(" AND ")}`;
      const totalRow = db.prepare(`SELECT COUNT(*) AS total FROM news_items ${where}`).get(...params) as { total: number };
      const rows = db
        .prepare(`SELECT * FROM news_items ${where} ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`)
        .all(...params, query.pageSize, query.offset) as Record<string, unknown>[];
      return { items: rows.map(mapNews), total: Number(totalRow.total) };
    },

    async listAdminNews(query: NewsListQuery) {
      const clauses: string[] = [];
      const params: SqlParam[] = [];
      if (query.kind) {
        clauses.push("kind = ?");
        params.push(query.kind);
      }
      if (query.status) {
        clauses.push("status = ?");
        params.push(query.status);
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const totalRow = db.prepare(`SELECT COUNT(*) AS total FROM news_items ${where}`).get(...params) as { total: number };
      const rows = db
        .prepare(`SELECT * FROM news_items ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
        .all(...params, query.pageSize, query.offset) as Record<string, unknown>[];
      return { items: rows.map(mapNews), total: Number(totalRow.total) };
    },

    async publishNews(id) {
      const timestamp = nowIso();
      db.prepare(
        `UPDATE news_items SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = ?
         WHERE id = ?`,
      ).run(timestamp, timestamp, id);
      const item = await sqlite.findNewsById(id);
      if (!item) throw new Error("News item could not be published.");
      return item;
    },

    async archiveNews(id) {
      db.prepare("UPDATE news_items SET status = 'archived', updated_at = ? WHERE id = ?").run(nowIso(), id);
      const item = await sqlite.findNewsById(id);
      if (!item) throw new Error("News item could not be archived.");
      return item;
    },

    async insertEventNotifications(values: InsertNotificationValues[]) {
      if (values.length === 0) return 0;
      const timestamp = nowIso();
      const insert = db.prepare(
        `INSERT OR IGNORE INTO event_notifications (event_id, user_id, email, status, sent_at, error_message, created_at)
         VALUES (?, ?, ?, 'pending', NULL, NULL, ?)`,
      );
      let inserted = 0;
      for (const value of values) {
        const result = insert.run(value.eventId, value.userId, value.email, timestamp);
        inserted += Number(result.changes);
      }
      return inserted;
    },

    async resetFailedEventNotifications(eventId) {
      db.prepare(
        "UPDATE event_notifications SET status = 'pending', error_message = NULL, sent_at = NULL WHERE event_id = ? AND status = 'failed'",
      ).run(eventId);
    },

    async listPendingEventNotifications(eventId) {
      const rows = db
        .prepare("SELECT * FROM event_notifications WHERE event_id = ? AND status = 'pending'")
        .all(eventId) as Record<string, unknown>[];
      return rows.map(mapEventNotification);
    },

    async listEventNotifications(eventId) {
      const rows = db
        .prepare("SELECT * FROM event_notifications WHERE event_id = ? ORDER BY created_at ASC")
        .all(eventId) as Record<string, unknown>[];
      return rows.map(mapEventNotification);
    },

    async markNotificationSent(id) {
      db.prepare("UPDATE event_notifications SET status = 'sent', sent_at = ?, error_message = NULL WHERE id = ?").run(
        nowIso(),
        id,
      );
    },

    async markNotificationFailed(id, errorMessage) {
      db.prepare("UPDATE event_notifications SET status = 'failed', error_message = ? WHERE id = ?").run(
        errorMessage.slice(0, 500),
        id,
      );
    },

    async close() {
      db.close();
    },
  };

  return sqlite;
}
