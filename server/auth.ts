import type { Request, Response, NextFunction } from "express";
import { compare, hash, hashSync } from "bcryptjs";
import { publicAppUrl as configuredPublicAppUrl } from "./config.js";
import { createSecretToken, hashSecretToken, isSecretTokenFormat } from "./crypto.js";
import { createSession, deleteSession, findValidSession, toPublicMember, type AppDatabase } from "./db.js";
import type { Member } from "./types.js";

export const SESSION_COOKIE = "bbs.sid";
export const SESSION_DAYS = 7;
const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = hashSync("timing-protection-placeholder", BCRYPT_ROUNDS);

export interface AuthLocals {
  member?: Member;
  sessionToken?: string;
}

export function sessionCookieBaseOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

export function sessionCookieOptions() {
  return {
    ...sessionCookieBaseOptions(),
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function createSessionId(): string {
  return createSecretToken();
}

export function createResetToken(): string {
  return createSecretToken();
}

export function hashResetToken(token: string): string {
  return hashSecretToken(token);
}

export function hashSessionToken(token: string): string {
  return hashSecretToken(token);
}

export function resetTokenTtlMinutes(): number {
  const parsed = Number(process.env.RESET_TOKEN_TTL_MINUTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

export function resetTokenExpiryDate(now = Date.now()): string {
  return new Date(now + resetTokenTtlMinutes() * 60 * 1000).toISOString();
}

export function publicAppUrl(): string {
  return configuredPublicAppUrl();
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

export function getSessionToken(req: Request): string | undefined {
  const value = req.cookies?.[SESSION_COOKIE];
  if (typeof value !== "string" || !isSecretTokenFormat(value)) {
    return undefined;
  }
  return value;
}

export async function issueAuthSession(res: Response, db: AppDatabase, userId: number): Promise<void> {
  const rawToken = createSessionId();
  await createSession(db, userId, rawToken, sessionExpiryDate());
  res.cookie(SESSION_COOKIE, rawToken, sessionCookieOptions());
}

export function attachSession(db: AppDatabase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionToken = getSessionToken(req);
      if (!sessionToken) {
        if (typeof req.cookies?.[SESSION_COOKIE] === "string") {
          res.clearCookie(SESSION_COOKIE, sessionCookieBaseOptions());
        }
        next();
        return;
      }

      const session = await findValidSession(db, sessionToken);
      if (!session) {
        res.clearCookie(SESSION_COOKIE, sessionCookieBaseOptions());
        next();
        return;
      }

      const locals = res.locals as AuthLocals;
      locals.member = toPublicMember(session.user);
      locals.sessionToken = sessionToken;
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

export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  const locals = res.locals as AuthLocals;
  if (!locals.member) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  if (locals.member.role !== "admin") {
    res.status(403).json({ error: "You do not have permission to do that." });
    return;
  }
  next();
}

export function createVerificationToken(): string {
  return createSecretToken();
}

export function hashVerificationToken(token: string): string {
  return hashSecretToken(token);
}

export function verificationTokenTtlHours(): number {
  const parsed = Number(process.env.VERIFY_TOKEN_TTL_HOURS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

export function verificationTokenExpiryDate(now = Date.now()): string {
  return new Date(now + verificationTokenTtlHours() * 60 * 60 * 1000).toISOString();
}

export async function clearAuthCookie(res: Response, db: AppDatabase): Promise<void> {
  const locals = res.locals as AuthLocals;
  if (locals.sessionToken) {
    await deleteSession(db, locals.sessionToken);
  }
  res.clearCookie(SESSION_COOKIE, sessionCookieBaseOptions());
}
