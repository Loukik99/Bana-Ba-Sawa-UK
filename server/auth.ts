import { createHash, randomBytes } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { compare, hash, hashSync } from "bcryptjs";
import type { DatabaseSync } from "node:sqlite";
import { deleteSession, findValidSession, toPublicMember } from "./db.ts";
import type { Member } from "./types.ts";

export const SESSION_COOKIE = "bbs.sid";
export const SESSION_DAYS = 7;
const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = hashSync("timing-protection-placeholder", 10);

export interface AuthLocals {
  member?: Member;
  sessionId?: string;
}

export function sessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function createSessionId(): string {
  return randomBytes(32).toString("hex");
}

export function createResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function resetTokenTtlMinutes(): number {
  const parsed = Number(process.env.RESET_TOKEN_TTL_MINUTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

export function resetTokenExpiryDate(now = Date.now()): string {
  return new Date(now + resetTokenTtlMinutes() * 60 * 1000).toISOString();
}

export function publicAppUrl(): string {
  const url = process.env.APP_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173";
  return url.replace(/\/$/, "");
}

export function sessionExpiryDate(): string {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function passwordsMatch(password: string, passwordHash: string | undefined): Promise<boolean> {
  return compare(password, passwordHash || DUMMY_HASH);
}

export function getSessionId(req: Request): string | undefined {
  const value = req.cookies?.[SESSION_COOKIE];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function attachSession(db: DatabaseSync) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = getSessionId(req);
      if (!sessionId) {
        next();
        return;
      }

      const session = findValidSession(db, sessionId);
      if (!session) {
        res.clearCookie(SESSION_COOKIE, { path: "/" });
        next();
        return;
      }

      const locals = res.locals as AuthLocals;
      locals.member = toPublicMember(session.user);
      locals.sessionId = sessionId;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAuth(_req: Request, res: Response, next: NextFunction) {
  const locals = res.locals as AuthLocals;
  if (!locals.member) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  next();
}

export function clearAuthCookie(res: Response, db: DatabaseSync): void {
  const locals = res.locals as AuthLocals;
  if (locals.sessionId) {
    deleteSession(db, locals.sessionId);
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
