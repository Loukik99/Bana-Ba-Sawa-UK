import type {
  AdminMemberListResponse,
  AdminMemberStats,
  FieldErrors,
  Member,
  MembershipStatus,
  ProfilePayload,
  RegisterPayload,
} from "./types";

export class ApiError extends Error {
  status: number;
  fields?: FieldErrors;

  constructor(message: string, status: number, fields?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Unable to reach the server. Please try again.", 0);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  let data: ({ error?: string; fields?: FieldErrors } & T) | null = null;
  if (isJson) {
    try {
      data = (await response.json()) as { error?: string; fields?: FieldErrors } & T;
    } catch {
      throw new ApiError("Something went wrong. Please try again.", response.status || 500);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      (data && "error" in data && data.error) || "Something went wrong. Please try again.",
      response.status,
      data && "fields" in data ? data.fields : undefined,
    );
  }

  return data as T;
}

export function fetchSession() {
  return api<{ member: Member | null }>("/auth/me");
}

export function loginRequest(email: string, password: string) {
  return api<{ member: Member }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(payload: RegisterPayload) {
  return api<{ member: Member; welcomeEmailSent?: boolean; verificationEmailSent?: boolean }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutRequest() {
  return api<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export function forgotPasswordRequest(email: string) {
  return api<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function validateResetTokenRequest(token: string) {
  return api<{ valid: boolean }>(`/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
}

export function resetPasswordRequest(token: string, password: string, confirmPassword: string) {
  return api<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password, confirmPassword }),
  });
}

export function updateProfileRequest(payload: ProfilePayload) {
  return api<{ member: Member }>("/members/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function validateVerificationTokenRequest(token: string) {
  return api<{ valid: boolean }>(`/auth/verify-email/validate?token=${encodeURIComponent(token)}`);
}

export function verifyEmailRequest(token: string) {
  return api<{ message: string; member: Member | null }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerificationRequest(email?: string) {
  return api<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(email ? { email } : {}),
  });
}

export function listAdminMembers(
  params: {
    status?: MembershipStatus;
    q?: string;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const query = search.toString();
  return api<AdminMemberListResponse>(`/admin/members${query ? `?${query}` : ""}`);
}

export function getAdminMember(id: number) {
  return api<{ member: Member }>(`/admin/members/${id}`);
}

export function updateAdminMemberStatus(id: number, status: MembershipStatus) {
  return api<{ member: Member }>(`/admin/members/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminMemberStats(): Promise<AdminMemberStats> {
  const [all, active, pending, suspended, rejected] = await Promise.all([
    listAdminMembers({ page: 1, pageSize: 1 }),
    listAdminMembers({ status: "active", page: 1, pageSize: 1 }),
    listAdminMembers({ status: "pending", page: 1, pageSize: 1 }),
    listAdminMembers({ status: "suspended", page: 1, pageSize: 1 }),
    listAdminMembers({ status: "rejected", page: 1, pageSize: 1 }),
  ]);

  return {
    total: all.total,
    active: active.total,
    pending: pending.total,
    suspended: suspended.total,
    rejected: rejected.total,
  };
}
