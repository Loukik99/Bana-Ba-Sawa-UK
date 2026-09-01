import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { DatabaseSync } from "node:sqlite";
import {
  createSession,
  deleteExpiredSessions,
  deleteSessionsForUser,
  findPasswordResetTokenByHash,
  findUserByEmail,
  insertPasswordResetToken,
  insertUser,
  invalidatePasswordResetTokensForUser,
  isUniqueConstraintError,
  markPasswordResetTokenUsed,
  nowIso,
  toPublicMember,
  updatePasswordHash,
  updateUser,
} from "./db.ts";
import {
  attachSession,
  clearAuthCookie,
  createResetToken,
  createSessionId,
  hashPassword,
  hashResetToken,
  passwordsMatch,
  publicAppUrl,
  requireAuth,
  resetTokenExpiryDate,
  resetTokenTtlMinutes,
  SESSION_COOKIE,
  sessionCookieOptions,
  sessionExpiryDate,
  type AuthLocals,
} from "./auth.ts";
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "./validation.ts";
import { createMailer, type Mailer } from "./mail.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function jsonError(res: Response, status: number, error: string, fields?: Record<string, string>) {
  res.status(status).json(fields ? { error, fields } : { error });
}

function attachClientOrigin(app: express.Express) {
  const origin = process.env.CLIENT_ORIGIN;
  if (!origin) return;

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

export interface CreateAppOptions {
  mailer?: Mailer;
}

export function createApp(db: DatabaseSync, options: CreateAppOptions = {}) {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  const isTest = process.env.NODE_ENV === "test";
  const mailer = options.mailer ?? createMailer();
  const forgotMessage =
    "If an account exists for that email, we have sent a password reset link.";
  const invalidResetMessage = "This reset link is invalid or has expired.";

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  attachClientOrigin(app);
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use(attachSession(db));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: { error: "Too many attempts. Please wait a few minutes and try again." },
  });

  const forgotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: { error: "Too many reset requests. Please wait a few minutes and try again." },
  });

  const api = express.Router();
  api.use(helmet());

  api.get("/health", (_req, res) => {
    deleteExpiredSessions(db);
    res.json({ ok: true });
  });

  api.get("/auth/me", (_req, res) => {
    const locals = res.locals as AuthLocals;
    res.json({ member: locals.member ?? null });
  });

  api.post("/auth/register", authLimiter, async (req, res, next) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const data = parsed.data;
      const passwordHash = await hashPassword(data.password);
      const user = insertUser(db, {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        city: data.city,
        postcode: data.postcode,
        heritageNotes: data.heritageNotes,
        eligibilityConfirmed: data.eligibilityConfirmed,
      });

      const sessionId = createSessionId();
      createSession(db, user.id, sessionId, sessionExpiryDate());
      res.cookie(SESSION_COOKIE, sessionId, sessionCookieOptions());
      res.status(201).json({ member: toPublicMember(user) });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        jsonError(res, 409, "An account with this email already exists.", {
          email: "An account with this email already exists.",
        });
        return;
      }
      next(error);
    }
  });

  api.post("/auth/login", authLimiter, async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const user = findUserByEmail(db, parsed.data.email);
      const matches = await passwordsMatch(parsed.data.password, user?.passwordHash);
      if (!user || !matches) {
        jsonError(res, 401, "Email or password is incorrect.");
        return;
      }

      const sessionId = createSessionId();
      createSession(db, user.id, sessionId, sessionExpiryDate());
      res.cookie(SESSION_COOKIE, sessionId, sessionCookieOptions());
      res.json({ member: toPublicMember(user) });
    } catch (error) {
      next(error);
    }
  });

  api.post("/auth/logout", (_req, res) => {
    clearAuthCookie(res, db);
    res.json({ ok: true });
  });

  api.post("/auth/forgot-password", forgotLimiter, async (req, res, next) => {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const user = findUserByEmail(db, parsed.data.email);
      if (user) {
        invalidatePasswordResetTokensForUser(db, user.id);
        const token = createResetToken();
        insertPasswordResetToken(db, {
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: resetTokenExpiryDate(),
        });
        await mailer.sendPasswordResetEmail({
          to: user.email,
          firstName: user.firstName,
          resetUrl: `${publicAppUrl()}/reset-password?token=${token}`,
          expiresMinutes: resetTokenTtlMinutes(),
        });
      }

      res.json({ message: forgotMessage });
    } catch (error) {
      next(error);
    }
  });

  api.get("/auth/reset-password/validate", (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const record = /^[a-f0-9]{64}$/i.test(token)
      ? findPasswordResetTokenByHash(db, hashResetToken(token))
      : undefined;

    if (!record || record.usedAt || record.expiresAt <= nowIso()) {
      jsonError(res, 400, invalidResetMessage);
      return;
    }

    res.json({ valid: true });
  });

  api.post("/auth/reset-password", authLimiter, async (req, res, next) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const record = findPasswordResetTokenByHash(db, hashResetToken(parsed.data.token));
      if (!record || record.usedAt || record.expiresAt <= nowIso()) {
        jsonError(res, 400, invalidResetMessage);
        return;
      }

      const passwordHash = await hashPassword(parsed.data.password);
      updatePasswordHash(db, record.userId, passwordHash);
      markPasswordResetTokenUsed(db, record.id);
      invalidatePasswordResetTokensForUser(db, record.userId);
      deleteSessionsForUser(db, record.userId);

      res.json({ message: "Your password has been updated. You can now sign in." });
    } catch (error) {
      next(error);
    }
  });

  api.get("/members/me", requireAuth, (_req, res) => {
    const locals = res.locals as AuthLocals;
    res.json({ member: locals.member });
  });

  api.patch("/members/me", requireAuth, async (req, res, next) => {
    try {
      const locals = res.locals as AuthLocals;
      const member = locals.member;
      if (!member) {
        jsonError(res, 401, "Please sign in to continue.");
        return;
      }

      const parsed = profileSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const data = parsed.data;
      const newPassword = data.newPassword?.trim() ?? "";
      let passwordHash: string | undefined;

      if (newPassword) {
        if (!data.currentPassword) {
          jsonError(res, 400, "Enter your current password to set a new one.", {
            currentPassword: "Enter your current password to set a new one.",
          });
          return;
        }

        const current = findUserByEmail(db, member.email);
        const matches = await passwordsMatch(data.currentPassword, current?.passwordHash);
        if (!matches) {
          jsonError(res, 400, "Current password is incorrect.", {
            currentPassword: "Current password is incorrect.",
          });
          return;
        }
        passwordHash = await hashPassword(newPassword);
      }

      const updated = updateUser(db, member.id, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        city: data.city,
        postcode: data.postcode,
        heritageNotes: data.heritageNotes,
        passwordHash,
      });

      res.json({ member: toPublicMember(updated) });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        jsonError(res, 409, "Another account already uses this email.", {
          email: "Another account already uses this email.",
        });
        return;
      }
      next(error);
    }
  });

  app.use("/api", api);

  if (isProduction) {
    const distDir = path.join(rootDir, "dist");
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const status =
      error && typeof error === "object" && "status" in error && typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    if (status >= 500) {
      console.error(error);
    }
    jsonError(
      res,
      status,
      status === 400 ? "Please check the submitted details." : "Something went wrong. Please try again.",
    );
  });

  return app;
}
