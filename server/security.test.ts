import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApp } from "./app.js";
import { createDatabase, hasStoredSessionId, insertPasswordResetToken } from "./db.js";
import { hashResetToken, hashSessionToken, sessionCookieBaseOptions, sessionCookieOptions } from "./auth.js";
import { allowDevMailPreview, publicAppUrl } from "./config.js";
import { createLoginFailureGuard } from "./login-guard.js";
import { createMailer, escapeHtml, htmlBody, MailDeliveryError, noopMailer, type Mailer, type PasswordResetEmail } from "./mail.js";

process.env.NODE_ENV = "test";
process.env.APP_URL = "https://banabasawa.example";

const FORGOT_MESSAGE = "If an account exists for that email, we have sent a password reset link.";
const INVALID_RESET_MESSAGE = "This reset link is invalid or has expired.";

interface JsonResponse {
  status: number;
  data: Record<string, unknown>;
  cookies: string[];
}

function cookieHeader(cookies: string[]): string {
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

function sessionCookie(cookies: string[]): string | undefined {
  return cookies.find((cookie) => cookie.startsWith("bbs.sid="));
}

function sessionTokenFrom(cookies: string[]): string {
  const cookie = sessionCookie(cookies);
  const value = cookie?.split(";")[0]?.slice("bbs.sid=".length) ?? "";
  return value;
}

function tokenFromResetUrl(url: string): string {
  return new URL(url).searchParams.get("token") ?? "";
}

async function listen(app: ReturnType<typeof createApp>): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const server = app.listen(0, "127.0.0.1") as Server;
  await new Promise<void>((resolve, reject) => {
    server.once("listening", () => resolve());
    server.once("error", reject);
  });
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function requestJson(
  baseUrl: string,
  path: string,
  options: { method?: string; body?: unknown; cookies?: string[] } = {},
): Promise<JsonResponse> {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.cookies?.length ? { Cookie: cookieHeader(options.cookies) } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await response.json()) as Record<string, unknown>;
  return {
    status: response.status,
    data,
    cookies: response.headers.getSetCookie(),
  };
}

describe("session, cookie, password and authorization security", () => {
  const inbox: PasswordResetEmail[] = [];
  const mailer: Mailer = {
    ...noopMailer,
    async sendPasswordResetEmail(payload) {
      inbox.push(payload);
    },
  };

  let db!: Awaited<ReturnType<typeof createDatabase>>;
  let app!: ReturnType<typeof createApp>;
  let baseUrl = "";
  let close = async () => {};

  const member = {
    firstName: "<img src=x onerror=alert(1)>",
    lastName: "Mbappe",
    email: "amina.security@example.com",
    password: "OldPass123",
    eligibilityConfirmed: true as const,
  };

  before(async () => {
    db = await createDatabase(":memory:");
    app = createApp(db, { mailer });
    const server = await listen(app);
    baseUrl = server.baseUrl;
    close = server.close;
  });

  after(async () => {
    await close();
    await db.close();
  });

  test("the API starts even when SMTP is not configured", () => {
    const previousHost = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;
    assert.doesNotThrow(() => createMailer());
    if (previousHost) process.env.SMTP_HOST = previousHost;
  });

  test("session cookies are hashed in the database and still authenticate", async () => {
    const created = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: member,
    });
    assert.equal(created.status, 201);

    const setCookie = sessionCookie(created.cookies);
    assert.ok(setCookie);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Path=\//i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.doesNotMatch(setCookie, /Secure/i);

    const rawToken = sessionTokenFrom(created.cookies);
    assert.match(rawToken, /^[a-f0-9]{64}$/i);
    assert.equal(JSON.stringify(created.data).includes(rawToken), false);
    assert.equal(await hasStoredSessionId(db, rawToken), false);
    assert.equal(await hasStoredSessionId(db, hashSessionToken(rawToken)), true);

    const me = await requestJson(baseUrl, "/auth/me", { cookies: created.cookies });
    assert.equal(me.status, 200);
    assert.equal((me.data.member as { email?: string } | null)?.email, member.email);
  });

  test("logout clears a compatible cookie and the session cannot be reused", async () => {
    const login = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: member.email, password: member.password },
    });
    assert.equal(login.status, 200);
    const rawToken = sessionTokenFrom(login.cookies);
    assert.equal(await hasStoredSessionId(db, hashSessionToken(rawToken)), true);

    const logout = await requestJson(baseUrl, "/auth/logout", {
      method: "POST",
      cookies: login.cookies,
    });
    assert.equal(logout.status, 200);

    const cleared = sessionCookie(logout.cookies);
    assert.ok(cleared);
    assert.equal(sessionTokenFrom(logout.cookies), "");
    assert.match(cleared, /Path=\//i);
    assert.match(cleared, /HttpOnly/i);
    assert.match(cleared, /SameSite=Lax/i);
    assert.match(cleared, /Expires=|Max-Age=0/i);

    const me = await requestJson(baseUrl, "/auth/me", { cookies: login.cookies });
    assert.equal(me.status, 200);
    assert.equal(me.data.member, null);

    const protectedRoute = await requestJson(baseUrl, "/members/me", { cookies: login.cookies });
    assert.equal(protectedRoute.status, 401);
    assert.equal(await hasStoredSessionId(db, hashSessionToken(rawToken)), false);
  });

  test("changing a password revokes other sessions and keeps the current user signed in", async () => {
    const first = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: member.email, password: member.password },
    });
    const second = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: member.email, password: member.password },
    });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);

    const changed = await requestJson(baseUrl, "/members/me", {
      method: "PATCH",
      cookies: second.cookies,
      body: {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: "",
        city: "",
        postcode: "",
        heritageNotes: "",
        currentPassword: member.password,
        newPassword: "NewPass456",
      },
    });
    assert.equal(changed.status, 200);

    const newToken = sessionTokenFrom(changed.cookies);
    assert.match(newToken, /^[a-f0-9]{64}$/i);
    assert.notEqual(newToken, sessionTokenFrom(second.cookies));

    const staleFirst = await requestJson(baseUrl, "/members/me", { cookies: first.cookies });
    assert.equal(staleFirst.status, 401);

    const staleSecond = await requestJson(baseUrl, "/members/me", { cookies: second.cookies });
    assert.equal(staleSecond.status, 401);

    const current = await requestJson(baseUrl, "/members/me", { cookies: changed.cookies });
    assert.equal(current.status, 200);
    assert.equal((current.data.member as { email?: string }).email, member.email);

    member.password = "NewPass456";
  });

  test("password reset revokes sessions and requires a new sign-in", async () => {
    const login = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: member.email, password: member.password },
    });
    inbox.length = 0;
    await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: member.email },
    });
    const token = tokenFromResetUrl(inbox[0]?.resetUrl ?? "");

    const reset = await requestJson(baseUrl, "/auth/reset-password", {
      method: "POST",
      body: { token, password: "ResetPass789", confirmPassword: "ResetPass789" },
    });
    assert.equal(reset.status, 200);

    const stale = await requestJson(baseUrl, "/members/me", { cookies: login.cookies });
    assert.equal(stale.status, 401);

    const oldPassword = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: member.email, password: member.password },
    });
    assert.equal(oldPassword.status, 401);

    member.password = "ResetPass789";
  });

  test("forgot-password uses the configured public URL and does not enumerate accounts", async () => {
    inbox.length = 0;
    const known = await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: member.email },
    });
    const unknown = await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: "missing@example.com" },
    });

    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.equal(known.data.message, FORGOT_MESSAGE);
    assert.equal(unknown.data.message, FORGOT_MESSAGE);
    assert.equal(inbox.length, 1);
    assert.match(inbox[0]?.resetUrl ?? "", /^https:\/\/banabasawa\.example\/reset-password\?token=[a-f0-9]{64}$/i);
  });

  test("HTML email content escapes user-controlled names", async () => {
    inbox.length = 0;
    await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: member.email },
    });
    const payload = inbox[0];
    assert.ok(payload);
    const html = htmlBody(payload);
    assert.equal(html.includes("<img src=x onerror=alert(1)>"), false);
    assert.equal(html.includes(escapeHtml(member.firstName)), true);
  });

  test("invalid, expired and used reset tokens are rejected", async () => {
    const fakeToken = "a".repeat(64);
    const invalid = await requestJson(baseUrl, `/auth/reset-password/validate?token=${fakeToken}`);
    assert.equal(invalid.status, 400);
    assert.equal(invalid.data.error, INVALID_RESET_MESSAGE);

    const expiredToken = "b".repeat(64);
    await insertPasswordResetToken(db, {
      userId: 1,
      tokenHash: hashResetToken(expiredToken),
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    const expired = await requestJson(baseUrl, `/auth/reset-password/validate?token=${expiredToken}`);
    assert.equal(expired.status, 400);

    inbox.length = 0;
    await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: member.email },
    });
    const token = tokenFromResetUrl(inbox[0]?.resetUrl ?? "");
    const reset = await requestJson(baseUrl, "/auth/reset-password", {
      method: "POST",
      body: { token, password: "UsedPass123", confirmPassword: "UsedPass123" },
    });
    assert.equal(reset.status, 200);

    const reused = await requestJson(baseUrl, "/auth/reset-password", {
      method: "POST",
      body: { token, password: "OtherPass123", confirmPassword: "OtherPass123" },
    });
    assert.equal(reused.status, 400);
    assert.equal(reused.data.error, INVALID_RESET_MESSAGE);
    member.password = "UsedPass123";
  });

  test("protected member routes require authentication and stay scoped to the signed-in member", async () => {
    const unauthenticated = await requestJson(baseUrl, "/members/me");
    assert.equal(unauthenticated.status, 401);

    const missing = await fetch(`${baseUrl}/api/members/2`);
    assert.equal(missing.status, 404);

    const other = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        firstName: "Jean",
        lastName: "Njeuma",
        email: "jean.security@example.com",
        password: "OtherPass123",
        eligibilityConfirmed: true,
      },
    });
    assert.equal(other.status, 201);

    const self = await requestJson(baseUrl, "/members/me", { cookies: other.cookies });
    assert.equal(self.status, 200);
    assert.equal((self.data.member as { email?: string }).email, "jean.security@example.com");

    const patched = await requestJson(baseUrl, "/members/me", {
      method: "PATCH",
      cookies: other.cookies,
      body: {
        firstName: "Jean",
        lastName: "Njeuma",
        email: "jean.security@example.com",
        phone: "07000000000",
        city: "London",
        postcode: "",
        heritageNotes: "",
        id: 1,
      },
    });
    assert.equal(patched.status, 200);
    assert.equal((patched.data.member as { email?: string; id?: number }).email, "jean.security@example.com");
    assert.notEqual((patched.data.member as { id?: number }).id, 1);

    const original = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: member.email, password: member.password },
    });
    const originalProfile = await requestJson(baseUrl, "/members/me", { cookies: original.cookies });
    assert.equal((originalProfile.data.member as { email?: string }).email, member.email);
    assert.notEqual((originalProfile.data.member as { phone?: string }).phone, "07000000000");
  });

  test("cookie creation and clearing share path, httpOnly, secure and sameSite", () => {
    const created = sessionCookieOptions();
    const cleared = sessionCookieBaseOptions();
    assert.equal(created.httpOnly, true);
    assert.equal(created.secure, false);
    assert.equal(created.sameSite, "lax");
    assert.equal(created.path, "/");
    assert.equal(cleared.httpOnly, created.httpOnly);
    assert.equal(cleared.secure, created.secure);
    assert.equal(cleared.sameSite, created.sameSite);
    assert.equal(cleared.path, created.path);

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const productionCookie = sessionCookieOptions();
      const productionClear = sessionCookieBaseOptions();
      assert.equal(productionCookie.secure, true);
      assert.equal(productionCookie.httpOnly, true);
      assert.equal(productionCookie.sameSite, "lax");
      assert.equal(productionCookie.path, "/");
      assert.equal(productionClear.secure, true);
      assert.equal(productionClear.httpOnly, true);
      assert.equal(productionClear.sameSite, "lax");
      assert.equal(productionClear.path, "/");
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});

describe("forgot-password SMTP failure does not enumerate accounts", () => {
  const failingMailer: Mailer = {
    ...noopMailer,
    async sendPasswordResetEmail() {
      throw new MailDeliveryError("SMTP unavailable");
    },
  };

  let db!: Awaited<ReturnType<typeof createDatabase>>;
  let baseUrl = "";
  let close = async () => {};

  before(async () => {
    db = await createDatabase(":memory:");
    const app = createApp(db, { mailer: failingMailer });
    const server = await listen(app);
    baseUrl = server.baseUrl;
    close = server.close;

    const created = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        firstName: "Amina",
        lastName: "Mbappe",
        email: "smtp.fail@example.com",
        password: "SecurePass1",
        eligibilityConfirmed: true,
      },
    });
    assert.equal(created.status, 201);
  });

  after(async () => {
    await close();
    await db.close();
  });

  test("known and unknown emails receive the same public response when mail fails", async () => {
    const known = await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: "smtp.fail@example.com" },
    });
    const unknown = await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: "missing@example.com" },
    });

    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.equal(known.data.message, FORGOT_MESSAGE);
    assert.equal(unknown.data.message, FORGOT_MESSAGE);
    assert.equal(known.data.error, undefined);
    assert.equal(unknown.data.error, undefined);
  });
});

describe("login failure throttling", () => {
  const mailer: Mailer = {
    ...noopMailer,
    async sendPasswordResetEmail() {},
  };

  let db!: Awaited<ReturnType<typeof createDatabase>>;
  let baseUrl = "";
  let close = async () => {};

  before(async () => {
    db = await createDatabase(":memory:");
    const app = createApp(db, {
      mailer,
      loginGuard: createLoginFailureGuard({ emailLimit: 3, emailIpLimit: 3, windowMs: 60_000 }),
    });
    const server = await listen(app);
    baseUrl = server.baseUrl;
    close = server.close;

    for (const email of ["throttle@example.com", "throttle-clear@example.com"]) {
      const created = await requestJson(baseUrl, "/auth/register", {
        method: "POST",
        body: {
          firstName: "Amina",
          lastName: "Mbappe",
          email,
          password: "SecurePass1",
          eligibilityConfirmed: true,
        },
      });
      assert.equal(created.status, 201);
    }
  });

  after(async () => {
    await close();
    await db.close();
  });

  test("repeated failures for one account are throttled without a permanent lockout", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const failed = await requestJson(baseUrl, "/auth/login", {
        method: "POST",
        body: { email: "throttle@example.com", password: "wrong-password" },
      });
      assert.equal(failed.status, 401);
      assert.equal(failed.data.error, "Email or password is incorrect.");
    }

    const limited = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "throttle@example.com", password: "wrong-password" },
    });
    assert.equal(limited.status, 429);
    assert.equal(limited.data.error, "Too many attempts. Please wait a few minutes and try again.");

    const validWhileLimited = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "throttle@example.com", password: "SecurePass1" },
    });
    assert.equal(validWhileLimited.status, 429);
  });

  test("unknown emails are throttled with the same public failure and limit responses", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const failed = await requestJson(baseUrl, "/auth/login", {
        method: "POST",
        body: { email: "missing-throttle@example.com", password: "wrong-password" },
      });
      assert.equal(failed.status, 401);
      assert.equal(failed.data.error, "Email or password is incorrect.");
    }

    const limited = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "missing-throttle@example.com", password: "wrong-password" },
    });
    assert.equal(limited.status, 429);
    assert.equal(limited.data.error, "Too many attempts. Please wait a few minutes and try again.");
  });

  test("a successful login clears the failure count", async () => {
    const failed = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "throttle-clear@example.com", password: "wrong-password" },
    });
    assert.equal(failed.status, 401);

    const success = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "throttle-clear@example.com", password: "SecurePass1" },
    });
    assert.equal(success.status, 200);

    const failedAgain = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "throttle-clear@example.com", password: "wrong-password" },
    });
    assert.equal(failedAgain.status, 401);
  });

  test("login rejects cross-site form bodies so cookie auth is not CSRF-reachable via HTML forms", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "email=throttle-clear@example.com&password=SecurePass1",
    });
    assert.equal(response.status, 400);
    const data = (await response.json()) as { error?: string };
    assert.equal(data.error, "Please check the highlighted fields.");
  });
});

describe("production configuration and development mail preview", () => {
  test("login failure throttling expires instead of locking the account", async () => {
    const guard = createLoginFailureGuard({ emailLimit: 2, emailIpLimit: 2, windowMs: 30 });
    guard.recordFailure("expiry@example.com", "127.0.0.1");
    guard.recordFailure("expiry@example.com", "127.0.0.1");
    assert.equal(guard.isLimited("expiry@example.com", "127.0.0.1"), true);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(guard.isLimited("expiry@example.com", "127.0.0.1"), false);
  });

  test("production APP_URL cannot be localhost", () => {
    assert.throws(
      () => publicAppUrl({ NODE_ENV: "production", APP_URL: "http://localhost:5173" }),
      /must not point to localhost/,
    );
    assert.equal(
      publicAppUrl({ NODE_ENV: "production", APP_URL: "https://banabasawa.uk" }),
      "https://banabasawa.uk",
    );
    assert.equal(allowDevMailPreview({ NODE_ENV: "development" }), true);
    assert.equal(allowDevMailPreview({ NODE_ENV: "production" }), false);
    assert.equal(allowDevMailPreview({ VERCEL: "1", NODE_ENV: "development" }), false);
  });

  test("production and hosted runtimes reject reset-email preview delivery", async () => {
    const payload: PasswordResetEmail = {
      to: "preview@example.com",
      firstName: "Amina",
      resetUrl: "https://banabasawa.uk/reset-password?token=" + "c".repeat(64),
      expiresMinutes: 60,
    };

    const productionMailer = createMailer({ NODE_ENV: "production" });
    await assert.rejects(() => productionMailer.sendPasswordResetEmail(payload), MailDeliveryError);

    const hostedMailer = createMailer({ NODE_ENV: "development", VERCEL: "1" });
    await assert.rejects(() => hostedMailer.sendPasswordResetEmail(payload), MailDeliveryError);

    const testMailer = createMailer({ NODE_ENV: "test" });
    await assert.rejects(() => testMailer.sendPasswordResetEmail(payload), MailDeliveryError);
  });
});
