import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
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
  type AppDatabase,
} from "./db.js";
import {
  attachSession,
  clearAuthCookie,
  createResetToken,
  hashPassword,
  hashResetToken,
  hashVerificationToken,
  issueAuthSession,
  passwordsMatch,
  publicAppUrl,
  requireAuth,
  resetTokenExpiryDate,
  resetTokenTtlMinutes,
  type AuthLocals,
} from "./auth.js";
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./validation.js";
import { createMailer, type Mailer } from "./mail.js";
import {
  createLoginFailureGuard,
  noopLoginFailureGuard,
  requestIp,
  type LoginFailureGuard,
} from "./login-guard.js";
import { createResendGuard, noopResendGuard, type ResendGuard } from "./resend-guard.js";
import { jsonError, logInternalError } from "./http.js";
import { issueVerificationEmail, sendRegistrationEmails } from "./registration-emails.js";
import { registerAdminMemberRoutes } from "./routes/admin-members.js";
import { registerContentRoutes } from "./routes/content.js";

function attachClientOrigin(app: express.Express) {
  const origin = process.env.CLIENT_ORIGIN?.trim().replace(/\/$/, "");
  if (!origin || origin === "*") return;

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
  loginGuard?: LoginFailureGuard;
  resendGuard?: ResendGuard;
}

export function createApp(db: AppDatabase, options: CreateAppOptions = {}) {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  const isTest = process.env.NODE_ENV === "test";
  const mailer = options.mailer ?? createMailer();
  const loginGuard = options.loginGuard ?? (isTest ? noopLoginFailureGuard() : createLoginFailureGuard());
  const resendGuard = options.resendGuard ?? (isTest ? noopResendGuard() : createResendGuard());
  const tooManyLoginAttempts = "Too many attempts. Please wait a few minutes and try again.";
  const forgotMessage =
    "If an account exists for that email, we have sent a password reset link.";
  const invalidResetMessage = "This reset link is invalid or has expired.";
  const invalidVerifyMessage = "This verification link is invalid or has expired.";
  const resendMessage =
    "If an account exists for that email and it still needs confirmation, we have sent a verification link.";

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  attachClientOrigin(app);
  app.use(express.json({ limit: "256kb" }));
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

  const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: { error: "Too many verification requests. Please wait a few minutes and try again." },
  });

  const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: { error: "Too many profile updates. Please wait a few minutes and try again." },
  });

  const api = express.Router();
  api.use(helmet());

  api.get("/health", async (_req, res, next) => {
    try {
      await db.healthCheck();
      await deleteExpiredSessions(db);
      res.json({ ok: true, service: "bana-ba-sawa-api", database: db.kind });
    } catch (error) {
      next(error);
    }
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
      const user = await insertUser(db, {
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

      const emails = await sendRegistrationEmails(db, mailer, user);
      await issueAuthSession(res, db, user.id);
      res.status(201).json({
        member: toPublicMember(user),
        welcomeEmailSent: emails.welcomeEmailSent,
        verificationEmailSent: emails.verificationEmailSent,
      });
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

      const email = parsed.data.email;
      const ip = requestIp(req);
      if (loginGuard.isLimited(email, ip)) {
        jsonError(res, 429, tooManyLoginAttempts);
        return;
      }

      const user = await findUserByEmail(db, email);
      const matches = await passwordsMatch(parsed.data.password, user?.passwordHash);
      if (!user || !matches) {
        loginGuard.recordFailure(email, ip);
        jsonError(res, 401, "Email or password is incorrect.");
        return;
      }

      loginGuard.clear(email, ip);
      await issueAuthSession(res, db, user.id);
      res.json({ member: toPublicMember(user) });
    } catch (error) {
      next(error);
    }
  });

  api.post("/auth/logout", async (_req, res, next) => {
    try {
      await clearAuthCookie(res, db);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  api.post("/auth/forgot-password", forgotLimiter, async (req, res, next) => {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      try {
        const user = await findUserByEmail(db, parsed.data.email);
        if (user) {
          await invalidatePasswordResetTokensForUser(db, user.id);
          const token = createResetToken();
          await insertPasswordResetToken(db, {
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
      } catch (error) {
        logInternalError("forgot-password", error);
      }

      res.json({ message: forgotMessage });
    } catch (error) {
      next(error);
    }
  });

  api.get("/auth/reset-password/validate", authLimiter, async (req, res, next) => {
    try {
      const token = typeof req.query.token === "string" ? req.query.token : "";
      const record = /^[a-f0-9]{64}$/i.test(token)
        ? await findPasswordResetTokenByHash(db, hashResetToken(token))
        : undefined;

      if (!record || record.usedAt || record.expiresAt <= nowIso()) {
        jsonError(res, 400, invalidResetMessage);
        return;
      }

      res.json({ valid: true });
    } catch (error) {
      next(error);
    }
  });

  api.post("/auth/reset-password", authLimiter, async (req, res, next) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const record = await findPasswordResetTokenByHash(db, hashResetToken(parsed.data.token));
      if (!record || record.usedAt || record.expiresAt <= nowIso()) {
        jsonError(res, 400, invalidResetMessage);
        return;
      }

      const passwordHash = await hashPassword(parsed.data.password);
      await updatePasswordHash(db, record.userId, passwordHash);
      await markPasswordResetTokenUsed(db, record.id);
      await invalidatePasswordResetTokensForUser(db, record.userId);
      await deleteSessionsForUser(db, record.userId);
      await clearAuthCookie(res, db);

      res.json({ message: "Your password has been updated. You can now sign in." });
    } catch (error) {
      next(error);
    }
  });

  api.get("/auth/verify-email/validate", authLimiter, async (req, res, next) => {
    try {
      const token = typeof req.query.token === "string" ? req.query.token : "";
      const record = /^[a-f0-9]{64}$/i.test(token)
        ? await db.findEmailVerificationTokenByHash(hashVerificationToken(token))
        : undefined;

      if (!record || record.usedAt || record.expiresAt <= nowIso()) {
        jsonError(res, 400, invalidVerifyMessage);
        return;
      }

      res.json({ valid: true });
    } catch (error) {
      next(error);
    }
  });

  api.post("/auth/verify-email", authLimiter, async (req, res, next) => {
    try {
      const parsed = verifyEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, invalidVerifyMessage);
        return;
      }

      const record = await db.findEmailVerificationTokenByHash(hashVerificationToken(parsed.data.token));
      if (!record || record.usedAt || record.expiresAt <= nowIso()) {
        jsonError(res, 400, invalidVerifyMessage);
        return;
      }

      await db.markEmailVerified(record.userId);
      await db.markEmailVerificationTokenUsed(record.id);
      await db.invalidateEmailVerificationTokensForUser(record.userId);

      const user = await db.findUserById(record.userId);
      res.json({
        message: "Your email address has been confirmed.",
        member: user ? toPublicMember(user) : null,
      });
    } catch (error) {
      next(error);
    }
  });

  api.post("/auth/resend-verification", verifyLimiter, async (req, res, next) => {
    try {
      const locals = res.locals as AuthLocals;
      const parsed = resendVerificationSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const requestedEmail = parsed.data.email;
      const email = locals.member?.email ?? requestedEmail;
      if (!email) {
        jsonError(res, 400, "Please enter a valid email.");
        return;
      }

      if (resendGuard.isLimited(email)) {
        jsonError(res, 429, "Too many verification requests. Please wait a few minutes and try again.");
        return;
      }
      resendGuard.record(email);

      try {
        const user = await findUserByEmail(db, email);
        if (user && !user.emailVerifiedAt) {
          await issueVerificationEmail(db, mailer, user);
        }
      } catch (error) {
        logInternalError("resend-verification", error);
      }

      if (locals.member) {
        res.json({ message: "If this account still needs confirmation, we have sent a verification link." });
        return;
      }

      res.json({ message: resendMessage });
    } catch (error) {
      next(error);
    }
  });

  api.get("/members/me", requireAuth, (_req, res) => {
    const locals = res.locals as AuthLocals;
    res.json({ member: locals.member });
  });

  api.patch("/members/me", profileLimiter, requireAuth, async (req, res, next) => {
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

        const current = await findUserByEmail(db, member.email);
        const matches = await passwordsMatch(data.currentPassword, current?.passwordHash);
        if (!matches) {
          jsonError(res, 400, "Current password is incorrect.", {
            currentPassword: "Current password is incorrect.",
          });
          return;
        }
        passwordHash = await hashPassword(newPassword);
      }

      const emailChanged = data.email !== member.email;
      const updated = await updateUser(db, member.id, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        city: data.city,
        postcode: data.postcode,
        heritageNotes: data.heritageNotes,
        passwordHash,
      });

      if (emailChanged) {
        await db.clearEmailVerified(member.id);
        const latest = await db.findUserById(member.id);
        if (latest) {
          await issueVerificationEmail(db, mailer, latest);
        }
      }

      if (passwordHash) {
        await invalidatePasswordResetTokensForUser(db, member.id);
        await deleteSessionsForUser(db, member.id);
        await issueAuthSession(res, db, member.id);
      }

      const latest = await db.findUserById(member.id);
      res.json({ member: toPublicMember(latest ?? updated) });
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

  registerAdminMemberRoutes(api, db);
  registerContentRoutes(api, db, mailer);

  app.use("/api", api);
  if (process.env.VERCEL) {
    app.use("/", api);
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const status =
      error && typeof error === "object" && "status" in error && typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    if (status >= 500) {
      logInternalError("api", error);
    }
    jsonError(
      res,
      status,
      status === 400 ? "Please check the submitted details." : "Something went wrong. Please try again.",
    );
  });

  return app;
}
