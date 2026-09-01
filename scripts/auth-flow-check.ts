import { createServer } from "node:http";
import { createApp } from "../server/app.ts";
import { createDatabase } from "../server/db.ts";

process.env.NODE_ENV = "test";

const db = createDatabase(":memory:");
let lastResetUrl = "";
const app = createApp(db, {
  mailer: {
    async sendPasswordResetEmail(payload) {
      lastResetUrl = payload.resetUrl;
    },
  },
});

const server = createServer(app);
await new Promise<void>((resolve) => {
  server.listen(0, "127.0.0.1", () => resolve());
});

const address = server.address();
if (!address || typeof address === "string") {
  throw new Error("Server did not start");
}

const base = `http://127.0.0.1:${address.port}`;
let cookie = "";

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (cookie) headers.set("Cookie", cookie);
  const res = await fetch(`${base}${path}`, { ...options, headers });
  for (const value of res.headers.getSetCookie()) {
    const pair = value.split(";")[0] ?? "";
    if (pair.startsWith("bbs.sid=")) {
      const sid = pair.slice("bbs.sid=".length);
      cookie = sid ? pair : "";
    }
  }
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { status: res.status, data };
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const memberPayload = {
  firstName: "Amina",
  lastName: "Mbappe",
  email: "amina@example.com",
  password: "securePass1",
  city: "London",
  eligibilityConfirmed: true,
};

try {
  let res = await request("/api/health");
  assert(res.status === 200, `health ${res.status}`);

  res = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...memberPayload, email: "not-an-email" }),
  });
  assert(res.status === 400, `register validation ${res.status}`);

  res = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(memberPayload),
  });
  const created = res.data?.member as { membershipNumber?: string; membershipStatus?: string; email?: string };
  assert(res.status === 201, `register ${res.status} ${JSON.stringify(res.data)}`);
  assert(created.membershipNumber?.startsWith("BBS-"), "membership number");
  assert(created.membershipStatus === "pending", "pending status");
  assert(cookie.startsWith("bbs.sid="), "session cookie");

  res = await request("/api/auth/me");
  const me = res.data?.member as { email?: string };
  assert(res.status === 200 && me.email === "amina@example.com", "session after register");

  res = await request("/api/members/me", {
    method: "PATCH",
    body: JSON.stringify({
      firstName: "Amina",
      lastName: "Mbappe",
      email: "amina@example.com",
      phone: "07123456789",
      city: "Manchester",
      postcode: "M1 1AA",
      heritageNotes: "Douala family",
    }),
  });
  const updated = res.data?.member as { city?: string; phone?: string };
  assert(res.status === 200 && updated.city === "Manchester" && updated.phone === "07123456789", "profile update");

  res = await request("/api/auth/logout", { method: "POST" });
  assert(res.status === 200, "logout");

  res = await request("/api/members/me");
  assert(res.status === 401, `protected after logout ${res.status}`);

  res = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "amina@example.com", password: "wrong-pass" }),
  });
  assert(res.status === 401, "bad login");

  res = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "amina@example.com", password: "securePass1" }),
  });
  assert(res.status === 200, "good login");

  res = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(memberPayload),
  });
  assert(res.status === 409, "duplicate email");

  cookie = "";
  res = await request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "amina@example.com" }),
  });
  assert(res.status === 200, "forgot password");
  assert(lastResetUrl.includes("token="), "reset url");
  const token = new URL(lastResetUrl).searchParams.get("token");
  assert(token, "reset token");

  res = await request(`/api/auth/reset-password/validate?token=${token}`);
  assert(res.status === 200, "validate token");

  res = await request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password: "newPass123", confirmPassword: "newPass123" }),
  });
  assert(res.status === 200, "reset password");

  res = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "amina@example.com", password: "securePass1" }),
  });
  assert(res.status === 401, "old password rejected");

  res = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "amina@example.com", password: "newPass123" }),
  });
  assert(res.status === 200, "login after reset");

  console.log("All authentication and membership API checks passed.");
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
