import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApp } from "./app.js";
import { createDatabase } from "./db.js";
import { hashVerificationToken, passwordsMatch } from "./auth.js";
import { createAdminAccount } from "./create-admin.js";
import { createResendGuard } from "./resend-guard.js";
import {
  escapeHtml,
  MailDeliveryError,
  noopMailer,
  welcomeHtmlBody,
  type EventNotificationEmail,
  type Mailer,
  type VerificationEmail,
  type WelcomeEmail,
} from "./mail.js";

process.env.NODE_ENV = "test";
process.env.APP_URL = "https://banabasawa.example";

interface JsonResponse {
  status: number;
  data: Record<string, unknown>;
  cookies: string[];
}

function cookieHeader(cookies: string[]): string {
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

function tokenFromUrl(url: string, key = "token"): string {
  return new URL(url).searchParams.get(key) ?? "";
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
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson
    ? ((await response.json()) as Record<string, unknown>)
    : { error: await response.text() };
  return {
    status: response.status,
    data,
    cookies: response.headers.getSetCookie(),
  };
}

const eventPayload = {
  title: "Community Gathering",
  description: "An evening for members in London.",
  eventDate: "2026-10-01",
  startTime: "18:00",
  endTime: "21:00",
  location: "London",
  eventUrl: "https://banabasawa.example/events/community-gathering",
};

const newsPayload = {
  kind: "news" as const,
  title: "AGM Notice",
  summary: "The annual general meeting will be held in October.",
  content: "Members are invited to attend the annual general meeting.",
};

describe("phase 3 core membership, content and notification APIs", () => {
  const welcomeInbox: WelcomeEmail[] = [];
  const verificationInbox: VerificationEmail[] = [];
  const eventInbox: EventNotificationEmail[] = [];

  const mailer: Mailer = {
    ...noopMailer,
    async sendWelcomeEmail(payload) {
      welcomeInbox.push(payload);
    },
    async sendVerificationEmail(payload) {
      verificationInbox.push(payload);
    },
    async sendEventNotificationEmail(payload) {
      eventInbox.push(payload);
    },
  };

  let db!: Awaited<ReturnType<typeof createDatabase>>;
  let app!: ReturnType<typeof createApp>;
  let baseUrl = "";
  let close = async () => {};
  let memberCookies: string[] = [];
  let adminCookies: string[] = [];
  let memberId = 0;

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

  test("member listing is empty when no members exist", async () => {
    const result = await db.listMembers({ page: 1, pageSize: 20, offset: 0 });
    assert.equal(result.total, 0);
    assert.equal(result.items.length, 0);
  });

  test("registration stores the member, sends welcome and verification mail, and never creates an admin", async () => {
    const failed = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: { firstName: "Amina", email: "not-an-email", password: "short", eligibilityConfirmed: true },
    });
    assert.equal(failed.status, 400);
    assert.equal((failed.data.fields as { password?: string }).password, "Password must be at least 8 characters.");
    assert.equal(welcomeInbox.length, 0);
    assert.equal(verificationInbox.length, 0);

    const created = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        firstName: "<img src=x onerror=alert(1)>",
        lastName: "Mbappe",
        email: "amina.phase3@example.com",
        password: "SecurePass1",
        eligibilityConfirmed: true,
        role: "admin",
        membershipStatus: "active",
      },
    });
    assert.equal(created.status, 201);
    const member = created.data.member as {
      id: number;
      role?: string;
      membershipStatus?: string;
      emailVerifiedAt?: string | null;
      email?: string;
    };
    memberId = member.id;
    memberCookies = created.cookies;
    assert.equal(member.role, "member");
    assert.equal(member.membershipStatus, "pending");
    assert.equal(member.emailVerifiedAt, null);
    assert.equal(created.data.welcomeEmailSent, true);
    assert.equal(created.data.verificationEmailSent, true);
    assert.equal(welcomeInbox.length, 1);
    assert.equal(welcomeInbox[0]?.to, "amina.phase3@example.com");
    assert.equal(verificationInbox.length, 1);
    assert.match(verificationInbox[0]?.verifyUrl ?? "", /^https:\/\/banabasawa\.example\/verify-email\?token=[a-f0-9]{64}$/i);
    assert.equal(welcomeHtmlBody(welcomeInbox[0]!).includes("<img src=x onerror=alert(1)>"), false);
    assert.equal(welcomeHtmlBody(welcomeInbox[0]!).includes(escapeHtml("<img src=x onerror=alert(1)>")), true);

    const stored = await db.findUserById(memberId);
    assert.ok(stored);
    assert.equal(stored.role, "member");
    assert.equal(stored.welcomeEmailSentAt !== null, true);
  });

  test("a new member can register with empty optional fields and then sign in", async () => {
    const email = `fresh.member.${Date.now()}@example.com`;
    const created = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        firstName: "Koko",
        lastName: "Ngo",
        email,
        password: "SecurePass1",
        phone: "",
        city: "",
        postcode: "",
        heritageNotes: "",
        eligibilityConfirmed: true,
      },
    });
    assert.equal(created.status, 201);
    assert.equal((created.data.member as { email?: string }).email, email);
    assert.equal((created.data.member as { role?: string }).role, "member");
    assert.ok(created.cookies.some((cookie) => cookie.startsWith("bbs.sid=")));

    const login = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email, password: "SecurePass1" },
    });
    assert.equal(login.status, 200);
    assert.equal((login.data.member as { email?: string }).email, email);

    const me = await requestJson(baseUrl, "/auth/me", { cookies: login.cookies });
    assert.equal(me.status, 200);
    assert.equal((me.data.member as { email?: string } | null)?.email, email);
  });

  test("failed registration does not send a welcome email", async () => {
    const beforeCount = welcomeInbox.length;
    const duplicate = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        firstName: "Amina",
        lastName: "Mbappe",
        email: "amina.phase3@example.com",
        password: "SecurePass1",
        eligibilityConfirmed: true,
      },
    });
    assert.equal(duplicate.status, 409);
    assert.equal(welcomeInbox.length, beforeCount);
  });

  test("verification tokens expire, are single-use, and mark the email verified", async () => {
    const token = tokenFromUrl(verificationInbox[0]?.verifyUrl ?? "");
    const valid = await requestJson(baseUrl, `/auth/verify-email/validate?token=${token}`);
    assert.equal(valid.status, 200);

    const expiredToken = "c".repeat(64);
    await db.insertEmailVerificationToken({
      userId: memberId,
      tokenHash: hashVerificationToken(expiredToken),
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    const expired = await requestJson(baseUrl, "/auth/verify-email", {
      method: "POST",
      body: { token: expiredToken },
    });
    assert.equal(expired.status, 400);

    const verified = await requestJson(baseUrl, "/auth/verify-email", {
      method: "POST",
      body: { token },
    });
    assert.equal(verified.status, 200);
    assert.equal((verified.data.member as { emailVerifiedAt?: string | null }).emailVerifiedAt !== null, true);

    const reused = await requestJson(baseUrl, "/auth/verify-email", {
      method: "POST",
      body: { token },
    });
    assert.equal(reused.status, 400);
  });

  test("resend verification is enumeration-safe and rate limited", async () => {
    const second = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        firstName: "Jean",
        lastName: "Njeuma",
        email: "jean.phase3@example.com",
        password: "SecurePass1",
        eligibilityConfirmed: true,
      },
    });
    assert.equal(second.status, 201);

    verificationInbox.length = 0;
    const known = await requestJson(baseUrl, "/auth/resend-verification", {
      method: "POST",
      body: { email: "jean.phase3@example.com" },
    });
    const unknown = await requestJson(baseUrl, "/auth/resend-verification", {
      method: "POST",
      body: { email: "missing.phase3@example.com" },
    });
    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.equal(known.data.message, unknown.data.message);
    assert.equal(verificationInbox.length, 1);
    assert.equal(verificationInbox[0]?.to, "jean.phase3@example.com");

    const tight = createResendGuard({ limit: 1, windowMs: 60_000 });
    const limitedApp = createApp(db, { mailer, resendGuard: tight });
    const limitedServer = await listen(limitedApp);
    try {
      const first = await requestJson(limitedServer.baseUrl, "/auth/resend-verification", {
        method: "POST",
        body: { email: "jean.phase3@example.com" },
      });
      const secondAttempt = await requestJson(limitedServer.baseUrl, "/auth/resend-verification", {
        method: "POST",
        body: { email: "jean.phase3@example.com" },
      });
      assert.equal(first.status, 200);
      assert.equal(secondAttempt.status, 429);
    } finally {
      await limitedServer.close();
    }
  });

  test("unauthenticated callers cannot access admin member APIs", async () => {
    const list = await requestJson(baseUrl, "/admin/members");
    assert.equal(list.status, 401);

    const detail = await requestJson(baseUrl, "/admin/members/1");
    assert.equal(detail.status, 401);
  });

  test("members cannot access admin APIs and cannot change membership status", async () => {
    const list = await requestJson(baseUrl, "/admin/members", { cookies: memberCookies });
    assert.equal(list.status, 403);

    const status = await requestJson(baseUrl, `/admin/members/${memberId}/status`, {
      method: "PATCH",
      cookies: memberCookies,
      body: { status: "active" },
    });
    assert.equal(status.status, 403);

    const profile = await requestJson(baseUrl, "/members/me", {
      method: "PATCH",
      cookies: memberCookies,
      body: {
        firstName: "Amina",
        lastName: "Mbappe",
        email: "amina.phase3@example.com",
        phone: "",
        city: "",
        postcode: "",
        heritageNotes: "",
        membershipStatus: "active",
        role: "admin",
      },
    });
    assert.equal(profile.status, 200);
    const member = profile.data.member as { membershipStatus?: string; role?: string };
    assert.equal(member.membershipStatus, "pending");
    assert.equal(member.role, "member");
  });

  test("a client admin can be created from the server-side command, not from a public endpoint", async () => {
    const publicCreate = await requestJson(baseUrl, "/admin/create", {
      method: "POST",
      body: { email: "admin.phase3@example.com", password: "SecurePass1" },
    });
    assert.equal(publicCreate.status, 404);

    const publicBootstrap = await requestJson(baseUrl, "/admin/bootstrap", {
      method: "POST",
      body: { email: "amina.phase3@example.com" },
    });
    assert.equal(publicBootstrap.status, 404);

    const created = await createAdminAccount(db, {
      name: "Admin User",
      email: "admin.phase3@example.com",
      password: "SecurePass1",
    });
    assert.equal(created.status, "created");
    assert.equal(created.email, "admin.phase3@example.com");
    assert.equal(created.role, "admin");

    const stored = await db.findUserByEmail("admin.phase3@example.com");
    assert.ok(stored);
    assert.equal(stored.role, "admin");
    assert.equal(stored.passwordHash === "SecurePass1", false);
    assert.equal(await passwordsMatch("SecurePass1", stored.passwordHash), true);

    const duplicate = await createAdminAccount(db, {
      name: "Admin User",
      email: "admin.phase3@example.com",
      password: "SecurePass1",
    });
    assert.equal(duplicate.status, "already_admin");

    const existingMember = await createAdminAccount(db, {
      name: "Amina Mbappe",
      email: "amina.phase3@example.com",
      password: "SecurePass1",
    });
    assert.equal(existingMember.status, "exists_member");
    assert.equal((await db.findUserByEmail("amina.phase3@example.com"))?.role, "member");

    const promoted = await createAdminAccount(db, {
      name: "Amina Mbappe",
      email: "amina.phase3@example.com",
      password: "SecurePass1",
      promoteIfExists: true,
    });
    assert.equal(promoted.status, "promoted");
    assert.equal((await db.findUserByEmail("amina.phase3@example.com"))?.role, "admin");
    await db.updateUserRole(memberId, "member");

    const login = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "admin.phase3@example.com", password: "SecurePass1" },
    });
    assert.equal(login.status, 200);
    adminCookies = login.cookies;
    assert.equal((login.data.member as { role?: string }).role, "admin");
  });

  test("an admin can list members and update membership status", async () => {
    const list = await requestJson(baseUrl, "/admin/members?status=pending", { cookies: adminCookies });
    assert.equal(list.status, 200);
    const members = list.data.members as Array<{ email?: string; passwordHash?: string }>;
    assert.equal(members.some((item) => item.email === "amina.phase3@example.com"), true);
    assert.equal(members.some((item) => "passwordHash" in item && item.passwordHash), false);

    const detail = await requestJson(baseUrl, `/admin/members/${memberId}`, { cookies: adminCookies });
    assert.equal(detail.status, 200);

    const updated = await requestJson(baseUrl, `/admin/members/${memberId}/status`, {
      method: "PATCH",
      cookies: adminCookies,
      body: { status: "active" },
    });
    assert.equal(updated.status, 200);
    assert.equal((updated.data.member as { membershipStatus?: string }).membershipStatus, "active");
  });

  test("events can be drafted, published, read publicly, and protected from unauthorized edits", async () => {
    const created = await requestJson(baseUrl, "/admin/events", {
      method: "POST",
      cookies: adminCookies,
      body: eventPayload,
    });
    assert.equal(created.status, 201);
    const event = created.data.event as { id: number; slug: string; status?: string };
    assert.equal(event.status, "draft");

    const publicBefore = await requestJson(baseUrl, "/events");
    assert.equal(publicBefore.status, 200);
    assert.equal(((publicBefore.data.events as unknown[]) ?? []).length, 0);

    const hidden = await requestJson(baseUrl, `/events/${event.slug}`);
    assert.equal(hidden.status, 404);

    const forbidden = await requestJson(baseUrl, "/admin/events", {
      method: "POST",
      cookies: memberCookies,
      body: eventPayload,
    });
    assert.equal(forbidden.status, 403);

    eventInbox.length = 0;
    const published = await requestJson(baseUrl, `/admin/events/${event.id}/publish`, {
      method: "POST",
      cookies: adminCookies,
    });
    assert.equal(published.status, 200);
    assert.equal((published.data.event as { status?: string }).status, "published");
    assert.equal(eventInbox.length, 1);
    assert.equal(eventInbox[0]?.to, "amina.phase3@example.com");

    const publicAfter = await requestJson(baseUrl, `/events/${event.slug}`);
    assert.equal(publicAfter.status, 200);
    assert.equal((publicAfter.data.event as { title?: string }).title, eventPayload.title);

    const edited = await requestJson(baseUrl, `/admin/events/${event.id}`, {
      method: "PATCH",
      cookies: adminCookies,
      body: { ...eventPayload, title: "Updated Gathering" },
    });
    assert.equal(edited.status, 200);
    assert.equal(eventInbox.length, 1);

    const republish = await requestJson(baseUrl, `/admin/events/${event.id}/publish`, {
      method: "POST",
      cookies: adminCookies,
    });
    assert.equal(republish.status, 200);
    assert.equal(eventInbox.length, 1);

    const notify = await requestJson(baseUrl, `/admin/events/${event.id}/notify`, {
      method: "POST",
      cookies: adminCookies,
    });
    assert.equal(notify.status, 200);
    assert.equal(eventInbox.length, 1);

    const history = await requestJson(baseUrl, `/admin/events/${event.id}/notifications`, { cookies: adminCookies });
    assert.equal(history.status, 200);
    const notifications = history.data.notifications as Array<{ email?: string }>;
    assert.equal(notifications.length, 1);

    const memberNotify = await requestJson(baseUrl, `/admin/events/${event.id}/notify`, {
      method: "POST",
      cookies: memberCookies,
    });
    assert.equal(memberNotify.status, 403);
  });

  test("news can be drafted, published, read publicly, and protected from unauthorized edits", async () => {
    const created = await requestJson(baseUrl, "/admin/news", {
      method: "POST",
      cookies: adminCookies,
      body: newsPayload,
    });
    assert.equal(created.status, 201);
    const item = created.data.item as { id: number; slug: string; status?: string };
    assert.equal(item.status, "draft");

    const hidden = await requestJson(baseUrl, `/news/${item.slug}`);
    assert.equal(hidden.status, 404);

    const forbidden = await requestJson(baseUrl, `/admin/news/${item.id}/publish`, {
      method: "POST",
      cookies: memberCookies,
    });
    assert.equal(forbidden.status, 403);

    const published = await requestJson(baseUrl, `/admin/news/${item.id}/publish`, {
      method: "POST",
      cookies: adminCookies,
    });
    assert.equal(published.status, 200);

    const visible = await requestJson(baseUrl, `/news/${item.slug}`);
    assert.equal(visible.status, 200);
    assert.equal((visible.data.item as { title?: string }).title, newsPayload.title);

    const list = await requestJson(baseUrl, "/news?kind=news");
    assert.equal(list.status, 200);
    assert.equal(((list.data.items as unknown[]) ?? []).length, 1);
  });

  test("invalid registration JSON returns a useful error", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    assert.equal(response.status, 400);
    const data = (await response.json()) as { error?: string };
    assert.equal(data.error, "Please check the submitted details.");
  });
});

describe("welcome email failure does not fail registration or claim delivery", () => {
  const failingMailer: Mailer = {
    ...noopMailer,
    async sendWelcomeEmail() {
      throw new MailDeliveryError("SMTP unavailable");
    },
    async sendVerificationEmail() {
      throw new MailDeliveryError("SMTP unavailable");
    },
  };

  let db!: Awaited<ReturnType<typeof createDatabase>>;
  let close = async () => {};
  let baseUrl = "";

  before(async () => {
    db = await createDatabase(":memory:");
    const app = createApp(db, { mailer: failingMailer });
    const server = await listen(app);
    baseUrl = server.baseUrl;
    close = server.close;
  });

  after(async () => {
    await close();
    await db.close();
  });

  test("the account is created and email flags stay false", async () => {
    const created = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        firstName: "Amina",
        lastName: "Mbappe",
        email: "smtp.welcome@example.com",
        password: "SecurePass1",
        eligibilityConfirmed: true,
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.welcomeEmailSent, false);
    assert.equal(created.data.verificationEmailSent, false);
    const stored = await db.findUserByEmail("smtp.welcome@example.com");
    assert.ok(stored);
    assert.equal(stored.welcomeEmailSentAt, null);
  });
});

describe("verification token storage failure does not fail registration", () => {
  let db!: Awaited<ReturnType<typeof createDatabase>>;
  let close = async () => {};
  let baseUrl = "";

  before(async () => {
    db = await createDatabase(":memory:");
    db.insertEmailVerificationToken = async () => {
      throw new Error("email_verification_tokens is not available");
    };
    const app = createApp(db, { mailer: noopMailer });
    const server = await listen(app);
    baseUrl = server.baseUrl;
    close = server.close;
  });

  after(async () => {
    await close();
    await db.close();
  });

  test("the member can still be created and signed in", async () => {
    const created = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: {
        firstName: "Koko",
        lastName: "Ngo",
        email: "verify.fail@example.com",
        password: "SecurePass1",
        eligibilityConfirmed: true,
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.verificationEmailSent, false);

    const login = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "verify.fail@example.com", password: "SecurePass1" },
    });
    assert.equal(login.status, 200);
    assert.ok(login.cookies.some((cookie) => cookie.startsWith("bbs.sid=")));
  });
});
