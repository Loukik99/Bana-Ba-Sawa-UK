import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApp } from "./app.js";
import { createDatabase, insertPasswordResetToken } from "./db.js";
import { hashResetToken } from "./auth.js";
import { noopMailer, type Mailer, type PasswordResetEmail } from "./mail.js";

process.env.NODE_ENV = "test";
process.env.APP_URL = "http://localhost:5173";

const INVALID_RESET_MESSAGE = "This reset link is invalid or has expired.";
const FORGOT_MESSAGE = "If an account exists for that email, we have sent a password reset link.";

interface JsonResponse {
  status: number;
  data: Record<string, unknown>;
  cookies: string[];
}

function cookieHeader(cookies: string[]): string {
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

function tokenFromResetUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.searchParams.get("token") ?? "";
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

describe("forgot and reset password", () => {
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
    firstName: "Amina",
    lastName: "Mbappe",
    email: "amina.reset@example.com",
    password: "OldPass123",
    eligibilityConfirmed: true as const,
  };

  before(async () => {
    db = await createDatabase(":memory:");
    app = createApp(db, { mailer });
    const server = await listen(app);
    baseUrl = server.baseUrl;
    close = server.close;

    const created = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: member,
    });
    assert.equal(created.status, 201);
  });

  after(async () => {
    await close();
    await db.close();
  });

  test("unknown emails receive the same response and no mail is sent", async () => {
    inbox.length = 0;
    const response = await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: "missing@example.com" },
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.message, FORGOT_MESSAGE);
    assert.equal(inbox.length, 0);
  });

  test("known emails send a single-use reset link", async () => {
    inbox.length = 0;
    const response = await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: member.email },
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.message, FORGOT_MESSAGE);
    assert.equal(inbox.length, 1);
    assert.equal(inbox[0]?.to, member.email);
    assert.match(inbox[0]?.resetUrl ?? "", /^http:\/\/localhost:5173\/reset-password\?token=[a-f0-9]{64}$/i);
  });

  test("invalid tokens are rejected", async () => {
    const fakeToken = "a".repeat(64);
    const validate = await requestJson(baseUrl, `/auth/reset-password/validate?token=${fakeToken}`);
    assert.equal(validate.status, 400);
    assert.equal(validate.data.error, INVALID_RESET_MESSAGE);

    const reset = await requestJson(baseUrl, "/auth/reset-password", {
      method: "POST",
      body: {
        token: fakeToken,
        password: "NewPass123",
        confirmPassword: "NewPass123",
      },
    });
    assert.equal(reset.status, 400);
    assert.equal(reset.data.error, INVALID_RESET_MESSAGE);
  });

  test("expired tokens are rejected", async () => {
    const token = "b".repeat(64);
    await insertPasswordResetToken(db, {
      userId: 1,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const validate = await requestJson(baseUrl, `/auth/reset-password/validate?token=${token}`);
    assert.equal(validate.status, 400);
    assert.equal(validate.data.error, INVALID_RESET_MESSAGE);

    const reset = await requestJson(baseUrl, "/auth/reset-password", {
      method: "POST",
      body: {
        token,
        password: "NewPass123",
        confirmPassword: "NewPass123",
      },
    });
    assert.equal(reset.status, 400);
    assert.equal(reset.data.error, INVALID_RESET_MESSAGE);
  });

  test("mismatched and short passwords are rejected on the server", async () => {
    inbox.length = 0;
    await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: member.email },
    });
    const token = tokenFromResetUrl(inbox[0]?.resetUrl ?? "");
    assert.equal(token.length, 64);

    const mismatch = await requestJson(baseUrl, "/auth/reset-password", {
      method: "POST",
      body: {
        token,
        password: "NewPass123",
        confirmPassword: "OtherPass123",
      },
    });
    assert.equal(mismatch.status, 400);
    assert.equal((mismatch.data.fields as { confirmPassword?: string }).confirmPassword, "Passwords do not match");

    const short = await requestJson(baseUrl, "/auth/reset-password", {
      method: "POST",
      body: {
        token,
        password: "short",
        confirmPassword: "short",
      },
    });
    assert.equal(short.status, 400);
    assert.equal(
      (short.data.fields as { password?: string }).password,
      "Password must be at least 8 characters",
    );
  });

  test("a valid token updates the password, cannot be reused, and signs the member out", async () => {
    const login = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: member.email, password: member.password },
    });
    assert.equal(login.status, 200);
    const sessionCookies = login.cookies;

    inbox.length = 0;
    await requestJson(baseUrl, "/auth/forgot-password", {
      method: "POST",
      body: { email: member.email },
    });
    const token = tokenFromResetUrl(inbox[0]?.resetUrl ?? "");

    const valid = await requestJson(baseUrl, `/auth/reset-password/validate?token=${token}`);
    assert.equal(valid.status, 200);
    assert.equal(valid.data.valid, true);

    const reset = await requestJson(baseUrl, "/auth/reset-password", {
      method: "POST",
      body: {
        token,
        password: "NewPass456",
        confirmPassword: "NewPass456",
      },
    });
    assert.equal(reset.status, 200);

    const reused = await requestJson(baseUrl, "/auth/reset-password", {
      method: "POST",
      body: {
        token,
        password: "AnotherPass789",
        confirmPassword: "AnotherPass789",
      },
    });
    assert.equal(reused.status, 400);
    assert.equal(reused.data.error, INVALID_RESET_MESSAGE);

    const staleSession = await requestJson(baseUrl, "/auth/me", { cookies: sessionCookies });
    assert.equal(staleSession.status, 200);
    assert.equal(staleSession.data.member, null);

    const oldPassword = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: member.email, password: member.password },
    });
    assert.equal(oldPassword.status, 401);

    const newPassword = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: member.email, password: "NewPass456" },
    });
    assert.equal(newPassword.status, 200);
  });
});
