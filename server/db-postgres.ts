import pg from "pg";
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
import { migratePostgres } from "./migrate.js";

const { Pool } = pg;

type GlobalPg = typeof globalThis & { bbsPgPool?: pg.Pool };

function isPgUniqueError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "23505";
}

function throwIfUnique(error: unknown): never {
  if (isPgUniqueError(error)) {
    throw new UniqueConstraintError();
  }
  throw error;
}

function shouldUseSsl(connectionString: string): boolean | { rejectUnauthorized: boolean } {
  if (/sslmode=disable/i.test(connectionString)) return false;
  if (
    process.env.NODE_ENV === "production" ||
    /sslmode=require|neon\.tech|supabase\.co|vercel-storage|pooler\.supabase/i.test(connectionString)
  ) {
    return { rejectUnauthorized: true };
  }
  return false;
}

function searchLike(value: string): string {
  return `%${value.replaceAll("\\", "").replaceAll("%", "").replaceAll("_", "")}%`;
}

export function createPgPool(connectionString = process.env.DATABASE_URL): pg.Pool {
  if (!connectionString?.trim()) {
    throw new Error("DATABASE_URL is required for PostgreSQL.");
  }

  const globalForPg = globalThis as GlobalPg;
  if (!globalForPg.bbsPgPool) {
    globalForPg.bbsPgPool = new Pool({
      connectionString,
      max: process.env.VERCEL ? 1 : 10,
      ssl: shouldUseSsl(connectionString),
    });
  }
  return globalForPg.bbsPgPool;
}

export async function createPostgresDatabase(connectionString = process.env.DATABASE_URL): Promise<AppDatabase> {
  const pool = createPgPool(connectionString);
  await migratePostgres(pool);

  const postgres: AppDatabase = {
    kind: "postgres",

    async healthCheck() {
      await pool.query("SELECT 1");
    },

    async findUserByEmail(email) {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      return result.rows[0] ? mapUser(result.rows[0]) : undefined;
    },

    async findUserById(id) {
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0] ? mapUser(result.rows[0]) : undefined;
    },

    async insertUser(values: InsertUserValues) {
      const timestamp = nowIso();
      const placeholderNumber = `TMP-${crypto.randomUUID()}`;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const inserted = await client.query(
          `INSERT INTO users (
            email, password_hash, first_name, last_name, phone, city, postcode,
            heritage_notes, membership_status, membership_number, eligibility_confirmed,
            role, email_verified_at, welcome_email_sent_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, NULL, NULL, $12, $13)
          RETURNING id`,
          [
            values.email,
            values.passwordHash,
            values.firstName,
            values.lastName,
            values.phone ?? "",
            values.city ?? "",
            values.postcode ?? "",
            values.heritageNotes ?? "",
            placeholderNumber,
            values.eligibilityConfirmed,
            values.role ?? "member",
            timestamp,
            timestamp,
          ],
        );
        const id = Number(inserted.rows[0].id);
        const membershipNumber = createMemberNumber(id, timestamp);
        await client.query("UPDATE users SET membership_number = $1 WHERE id = $2", [membershipNumber, id]);
        await client.query("COMMIT");
        const user = await postgres.findUserById(id);
        if (!user) {
          throw new Error("Failed to load the newly created member.");
        }
        return user;
      } catch (error) {
        await client.query("ROLLBACK");
        throwIfUnique(error);
      } finally {
        client.release();
      }
    },

    async updateUser(id, values: UpdateUserValues) {
      const timestamp = nowIso();
      try {
        if (values.passwordHash) {
          await pool.query(
            `UPDATE users SET
              email = $1, first_name = $2, last_name = $3, phone = $4, city = $5,
              postcode = $6, heritage_notes = $7, password_hash = $8, updated_at = $9
            WHERE id = $10`,
            [
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
            ],
          );
        } else {
          await pool.query(
            `UPDATE users SET
              email = $1, first_name = $2, last_name = $3, phone = $4, city = $5,
              postcode = $6, heritage_notes = $7, updated_at = $8
            WHERE id = $9`,
            [
              values.email,
              values.firstName,
              values.lastName,
              values.phone,
              values.city,
              values.postcode,
              values.heritageNotes,
              timestamp,
              id,
            ],
          );
        }
      } catch (error) {
        throwIfUnique(error);
      }

      const user = await postgres.findUserById(id);
      if (!user) {
        throw new Error("Member record could not be updated.");
      }
      return user;
    },

    async updateUserMembershipStatus(id, status: MembershipStatus) {
      await pool.query("UPDATE users SET membership_status = $1, updated_at = $2 WHERE id = $3", [
        status,
        nowIso(),
        id,
      ]);
      const user = await postgres.findUserById(id);
      if (!user) throw new Error("Member record could not be updated.");
      return user;
    },

    async updateUserRole(id, role: UserRole) {
      await pool.query("UPDATE users SET role = $1, updated_at = $2 WHERE id = $3", [role, nowIso(), id]);
      const user = await postgres.findUserById(id);
      if (!user) throw new Error("Member record could not be updated.");
      return user;
    },

    async markEmailVerified(id) {
      const timestamp = nowIso();
      await pool.query(
        "UPDATE users SET email_verified_at = $1, updated_at = $2 WHERE id = $3 AND email_verified_at IS NULL",
        [timestamp, timestamp, id],
      );
      const user = await postgres.findUserById(id);
      if (!user) throw new Error("Member record could not be updated.");
      return user;
    },

    async clearEmailVerified(id) {
      await pool.query("UPDATE users SET email_verified_at = NULL, updated_at = $1 WHERE id = $2", [nowIso(), id]);
    },

    async markWelcomeEmailSent(id) {
      const timestamp = nowIso();
      const result = await pool.query(
        "UPDATE users SET welcome_email_sent_at = $1, updated_at = $2 WHERE id = $3 AND welcome_email_sent_at IS NULL",
        [timestamp, timestamp, id],
      );
      return (result.rowCount ?? 0) > 0;
    },

    async countUsersByRole(role) {
      const result = await pool.query("SELECT COUNT(*)::int AS total FROM users WHERE role = $1", [role]);
      return Number(result.rows[0].total);
    },

    async listMembers(query: MemberListQuery) {
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (query.status) {
        params.push(query.status);
        clauses.push(`membership_status = $${params.length}`);
      }
      if (query.search) {
        const like = searchLike(query.search);
        params.push(like);
        const index = params.length;
        clauses.push(
          `(email ILIKE $${index} OR first_name ILIKE $${index} OR last_name ILIKE $${index} OR membership_number ILIKE $${index})`,
        );
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const total = await pool.query(`SELECT COUNT(*)::int AS total FROM users ${where}`, params);
      const rows = await pool.query(
        `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, query.pageSize, query.offset],
      );
      return { items: rows.rows.map(mapUser), total: Number(total.rows[0].total) };
    },

    async listEligibleNotificationRecipients() {
      const result = await pool.query(
        "SELECT * FROM users WHERE membership_status = 'active' AND email_verified_at IS NOT NULL",
      );
      return result.rows.map(mapUser);
    },

    async createSession(userId, sessionToken, expiresAt) {
      await pool.query("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4)", [
        hashSecretToken(sessionToken),
        userId,
        expiresAt,
        nowIso(),
      ]);
    },

    async findValidSession(sessionToken) {
      if (!isSecretTokenFormat(sessionToken)) return undefined;
      const storedId = hashSecretToken(sessionToken);
      const result = await pool.query(
        `SELECT users.*, sessions.expires_at AS session_expires_at
         FROM sessions
         INNER JOIN users ON users.id = sessions.user_id
         WHERE sessions.id = $1`,
        [storedId],
      );
      const row = result.rows[0] as Record<string, unknown> | undefined;
      if (!row) return undefined;
      if (asIso(row.session_expires_at) <= nowIso()) {
        await pool.query("DELETE FROM sessions WHERE id = $1", [storedId]);
        return undefined;
      }
      return {
        user: mapUser(row),
        expiresAt: asIso(row.session_expires_at),
      };
    },

    async deleteSession(sessionToken) {
      await pool.query("DELETE FROM sessions WHERE id = $1", [hashSecretToken(sessionToken)]);
    },

    async hasStoredSessionId(storedId) {
      const result = await pool.query("SELECT 1 FROM sessions WHERE id = $1", [storedId]);
      return (result.rowCount ?? 0) > 0;
    },

    async deleteExpiredSessions() {
      await pool.query("DELETE FROM sessions WHERE expires_at <= $1", [nowIso()]);
    },

    async deleteSessionsForUser(userId) {
      await pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    },

    async updatePasswordHash(userId, passwordHash) {
      await pool.query("UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3", [
        passwordHash,
        nowIso(),
        userId,
      ]);
    },

    async insertPasswordResetToken(values: InsertResetTokenValues) {
      const result = await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
         VALUES ($1, $2, $3, NULL, $4)
         RETURNING id`,
        [values.userId, values.tokenHash, values.expiresAt, nowIso()],
      );
      return Number(result.rows[0].id);
    },

    async findPasswordResetTokenByHash(tokenHash) {
      const result = await pool.query("SELECT * FROM password_reset_tokens WHERE token_hash = $1", [tokenHash]);
      return result.rows[0] ? mapResetToken(result.rows[0]) : undefined;
    },

    async markPasswordResetTokenUsed(id) {
      await pool.query("UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2 AND used_at IS NULL", [
        nowIso(),
        id,
      ]);
    },

    async invalidatePasswordResetTokensForUser(userId) {
      await pool.query("UPDATE password_reset_tokens SET used_at = $1 WHERE user_id = $2 AND used_at IS NULL", [
        nowIso(),
        userId,
      ]);
    },

    async insertEmailVerificationToken(values: InsertVerificationTokenValues) {
      const result = await pool.query(
        `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, used_at, created_at)
         VALUES ($1, $2, $3, NULL, $4)
         RETURNING id`,
        [values.userId, values.tokenHash, values.expiresAt, nowIso()],
      );
      return Number(result.rows[0].id);
    },

    async findEmailVerificationTokenByHash(tokenHash) {
      const result = await pool.query("SELECT * FROM email_verification_tokens WHERE token_hash = $1", [tokenHash]);
      return result.rows[0] ? mapVerificationToken(result.rows[0]) : undefined;
    },

    async markEmailVerificationTokenUsed(id) {
      await pool.query("UPDATE email_verification_tokens SET used_at = $1 WHERE id = $2 AND used_at IS NULL", [
        nowIso(),
        id,
      ]);
    },

    async invalidateEmailVerificationTokensForUser(userId) {
      await pool.query("UPDATE email_verification_tokens SET used_at = $1 WHERE user_id = $2 AND used_at IS NULL", [
        nowIso(),
        userId,
      ]);
    },

    async eventSlugExists(slug, excludeId) {
      const result = excludeId
        ? await pool.query("SELECT 1 FROM events WHERE slug = $1 AND id != $2", [slug, excludeId])
        : await pool.query("SELECT 1 FROM events WHERE slug = $1", [slug]);
      return (result.rowCount ?? 0) > 0;
    },

    async insertEvent(values: InsertEventValues) {
      const timestamp = nowIso();
      try {
        const result = await pool.query(
          `INSERT INTO events (
            title, slug, description, event_date, start_time, end_time, location, event_url,
            status, created_at, updated_at, published_at, created_by, notified_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10, NULL, $11, NULL)
          RETURNING id`,
          [
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
          ],
        );
        const event = await postgres.findEventById(Number(result.rows[0].id));
        if (!event) throw new Error("Failed to load the newly created event.");
        return event;
      } catch (error) {
        throwIfUnique(error);
      }
    },

    async updateEvent(id, values: UpdateEventValues) {
      try {
        await pool.query(
          `UPDATE events SET
            title = $1, slug = $2, description = $3, event_date = $4, start_time = $5, end_time = $6,
            location = $7, event_url = $8, updated_at = $9
           WHERE id = $10`,
          [
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
          ],
        );
      } catch (error) {
        throwIfUnique(error);
      }
      const event = await postgres.findEventById(id);
      if (!event) throw new Error("Event record could not be updated.");
      return event;
    },

    async findEventById(id) {
      const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
      return result.rows[0] ? mapEvent(result.rows[0]) : undefined;
    },

    async findEventBySlug(slug) {
      const result = await pool.query("SELECT * FROM events WHERE slug = $1", [slug]);
      return result.rows[0] ? mapEvent(result.rows[0]) : undefined;
    },

    async listPublishedEvents(query: EventListQuery) {
      const total = await pool.query("SELECT COUNT(*)::int AS total FROM events WHERE status = 'published'");
      const rows = await pool.query(
        `SELECT * FROM events WHERE status = 'published'
         ORDER BY event_date ASC, start_time ASC LIMIT $1 OFFSET $2`,
        [query.pageSize, query.offset],
      );
      return { items: rows.rows.map(mapEvent), total: Number(total.rows[0].total) };
    },

    async listAdminEvents(query: EventListQuery) {
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (query.status) {
        params.push(query.status);
        clauses.push(`status = $${params.length}`);
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const total = await pool.query(`SELECT COUNT(*)::int AS total FROM events ${where}`, params);
      const rows = await pool.query(
        `SELECT * FROM events ${where} ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, query.pageSize, query.offset],
      );
      return { items: rows.rows.map(mapEvent), total: Number(total.rows[0].total) };
    },

    async publishEvent(id) {
      const timestamp = nowIso();
      await pool.query(
        `UPDATE events SET status = 'published', published_at = COALESCE(published_at, $1), updated_at = $2
         WHERE id = $3`,
        [timestamp, timestamp, id],
      );
      const event = await postgres.findEventById(id);
      if (!event) throw new Error("Event could not be published.");
      return event;
    },

    async archiveEvent(id) {
      await pool.query("UPDATE events SET status = 'archived', updated_at = $1 WHERE id = $2", [nowIso(), id]);
      const event = await postgres.findEventById(id);
      if (!event) throw new Error("Event could not be archived.");
      return event;
    },

    async markEventNotified(id) {
      const timestamp = nowIso();
      await pool.query("UPDATE events SET notified_at = COALESCE(notified_at, $1), updated_at = $2 WHERE id = $3", [
        timestamp,
        timestamp,
        id,
      ]);
    },

    async newsSlugExists(slug, excludeId) {
      const result = excludeId
        ? await pool.query("SELECT 1 FROM news_items WHERE slug = $1 AND id != $2", [slug, excludeId])
        : await pool.query("SELECT 1 FROM news_items WHERE slug = $1", [slug]);
      return (result.rowCount ?? 0) > 0;
    },

    async insertNews(values: InsertNewsValues) {
      const timestamp = nowIso();
      try {
        const result = await pool.query(
          `INSERT INTO news_items (
            kind, title, slug, summary, content, status, published_at, created_at, updated_at, created_by
          ) VALUES ($1, $2, $3, $4, $5, 'draft', NULL, $6, $7, $8)
          RETURNING id`,
          [
            values.kind,
            values.title,
            values.slug,
            values.summary,
            values.content,
            timestamp,
            timestamp,
            values.createdBy,
          ],
        );
        const item = await postgres.findNewsById(Number(result.rows[0].id));
        if (!item) throw new Error("Failed to load the newly created news item.");
        return item;
      } catch (error) {
        throwIfUnique(error);
      }
    },

    async updateNews(id, values: UpdateNewsValues) {
      try {
        await pool.query(
          `UPDATE news_items SET
            kind = $1, title = $2, slug = $3, summary = $4, content = $5, updated_at = $6
           WHERE id = $7`,
          [values.kind, values.title, values.slug, values.summary, values.content, nowIso(), id],
        );
      } catch (error) {
        throwIfUnique(error);
      }
      const item = await postgres.findNewsById(id);
      if (!item) throw new Error("News item could not be updated.");
      return item;
    },

    async findNewsById(id) {
      const result = await pool.query("SELECT * FROM news_items WHERE id = $1", [id]);
      return result.rows[0] ? mapNews(result.rows[0]) : undefined;
    },

    async findNewsBySlug(slug) {
      const result = await pool.query("SELECT * FROM news_items WHERE slug = $1", [slug]);
      return result.rows[0] ? mapNews(result.rows[0]) : undefined;
    },

    async listPublishedNews(query: NewsListQuery) {
      const clauses = ["status = 'published'"];
      const params: unknown[] = [];
      if (query.kind) {
        params.push(query.kind);
        clauses.push(`kind = $${params.length}`);
      }
      const where = `WHERE ${clauses.join(" AND ")}`;
      const total = await pool.query(`SELECT COUNT(*)::int AS total FROM news_items ${where}`, params);
      const rows = await pool.query(
        `SELECT * FROM news_items ${where} ORDER BY published_at DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, query.pageSize, query.offset],
      );
      return { items: rows.rows.map(mapNews), total: Number(total.rows[0].total) };
    },

    async listAdminNews(query: NewsListQuery) {
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (query.kind) {
        params.push(query.kind);
        clauses.push(`kind = $${params.length}`);
      }
      if (query.status) {
        params.push(query.status);
        clauses.push(`status = $${params.length}`);
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const total = await pool.query(`SELECT COUNT(*)::int AS total FROM news_items ${where}`, params);
      const rows = await pool.query(
        `SELECT * FROM news_items ${where} ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, query.pageSize, query.offset],
      );
      return { items: rows.rows.map(mapNews), total: Number(total.rows[0].total) };
    },

    async publishNews(id) {
      const timestamp = nowIso();
      await pool.query(
        `UPDATE news_items SET status = 'published', published_at = COALESCE(published_at, $1), updated_at = $2
         WHERE id = $3`,
        [timestamp, timestamp, id],
      );
      const item = await postgres.findNewsById(id);
      if (!item) throw new Error("News item could not be published.");
      return item;
    },

    async archiveNews(id) {
      await pool.query("UPDATE news_items SET status = 'archived', updated_at = $1 WHERE id = $2", [nowIso(), id]);
      const item = await postgres.findNewsById(id);
      if (!item) throw new Error("News item could not be archived.");
      return item;
    },

    async insertEventNotifications(values: InsertNotificationValues[]) {
      if (values.length === 0) return 0;
      const timestamp = nowIso();
      let inserted = 0;
      for (const value of values) {
        const result = await pool.query(
          `INSERT INTO event_notifications (event_id, user_id, email, status, sent_at, error_message, created_at)
           VALUES ($1, $2, $3, 'pending', NULL, NULL, $4)
           ON CONFLICT (event_id, user_id) DO NOTHING`,
          [value.eventId, value.userId, value.email, timestamp],
        );
        inserted += result.rowCount ?? 0;
      }
      return inserted;
    },

    async resetFailedEventNotifications(eventId) {
      await pool.query(
        "UPDATE event_notifications SET status = 'pending', error_message = NULL, sent_at = NULL WHERE event_id = $1 AND status = 'failed'",
        [eventId],
      );
    },

    async listPendingEventNotifications(eventId) {
      const result = await pool.query(
        "SELECT * FROM event_notifications WHERE event_id = $1 AND status = 'pending'",
        [eventId],
      );
      return result.rows.map(mapEventNotification);
    },

    async listEventNotifications(eventId) {
      const result = await pool.query(
        "SELECT * FROM event_notifications WHERE event_id = $1 ORDER BY created_at ASC",
        [eventId],
      );
      return result.rows.map(mapEventNotification);
    },

    async markNotificationSent(id) {
      await pool.query(
        "UPDATE event_notifications SET status = 'sent', sent_at = $1, error_message = NULL WHERE id = $2",
        [nowIso(), id],
      );
    },

    async markNotificationFailed(id, errorMessage) {
      await pool.query("UPDATE event_notifications SET status = 'failed', error_message = $1 WHERE id = $2", [
        errorMessage.slice(0, 500),
        id,
      ]);
    },

    async close() {
      const globalForPg = globalThis as GlobalPg;
      await pool.end();
      if (globalForPg.bbsPgPool === pool) {
        delete globalForPg.bbsPgPool;
      }
    },
  };

  return postgres;
}
