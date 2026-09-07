import {
  CONTENT_STATUSES,
  MEMBERSHIP_STATUSES,
  NEWS_KINDS,
  NOTIFICATION_STATUSES,
  USER_ROLES,
  type ContentStatus,
  type EmailVerificationTokenRecord,
  type EventNotificationRecord,
  type EventRecord,
  type Member,
  type MembershipStatus,
  type NewsKind,
  type NewsRecord,
  type NotificationStatus,
  type PasswordResetTokenRecord,
  type UserRecord,
  type UserRole,
} from "./types.js";

export class UniqueConstraintError extends Error {
  constructor(message = "Unique constraint violated") {
    super(message);
    this.name = "UniqueConstraintError";
  }
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof UniqueConstraintError ||
    (error instanceof Error && /unique/i.test(error.message))
  );
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createMemberNumber(id: number, createdAt: string): string {
  const year = createdAt.slice(0, 4) || String(new Date().getFullYear());
  return `BBS-${year}-${String(id).padStart(4, "0")}`;
}

export function asString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function asNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return Number(value ?? 0);
}

export function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "t" || value === "true";
}

export function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return asString(value);
}

export function asNullableIso(value: unknown): string | null {
  if (value == null) return null;
  return asIso(value);
}

export function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  const text = asString(value);
  return text.length === 0 ? null : text;
}

export function asDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return asString(value).slice(0, 10);
}

export function asTime(value: unknown): string {
  const text = asString(value);
  return text.length >= 5 ? text.slice(0, 5) : text;
}

export function asNullableTime(value: unknown): string | null {
  if (value == null || asString(value) === "") return null;
  return asTime(value);
}

export function asStatus(value: unknown): MembershipStatus {
  const status = asString(value);
  if (status === "inactive") return "suspended";
  if ((MEMBERSHIP_STATUSES as readonly string[]).includes(status)) {
    return status as MembershipStatus;
  }
  return "pending";
}

export function asRole(value: unknown): UserRole {
  const role = asString(value);
  if ((USER_ROLES as readonly string[]).includes(role)) {
    return role as UserRole;
  }
  return "member";
}

export function asContentStatus(value: unknown): ContentStatus {
  const status = asString(value);
  if ((CONTENT_STATUSES as readonly string[]).includes(status)) {
    return status as ContentStatus;
  }
  return "draft";
}

export function asNewsKind(value: unknown): NewsKind {
  const kind = asString(value);
  if ((NEWS_KINDS as readonly string[]).includes(kind)) {
    return kind as NewsKind;
  }
  return "news";
}

export function asNotificationStatus(value: unknown): NotificationStatus {
  const status = asString(value);
  if ((NOTIFICATION_STATUSES as readonly string[]).includes(status)) {
    return status as NotificationStatus;
  }
  return "pending";
}

export function mapUser(row: Record<string, unknown>): UserRecord {
  return {
    id: asNumber(row.id),
    email: asString(row.email),
    passwordHash: asString(row.password_hash),
    firstName: asString(row.first_name),
    lastName: asString(row.last_name),
    phone: asString(row.phone),
    city: asString(row.city),
    postcode: asString(row.postcode),
    heritageNotes: asString(row.heritage_notes),
    membershipStatus: asStatus(row.membership_status),
    membershipNumber: asString(row.membership_number),
    eligibilityConfirmed: asBoolean(row.eligibility_confirmed),
    role: asRole(row.role),
    emailVerifiedAt: asNullableIso(row.email_verified_at),
    welcomeEmailSentAt: asNullableIso(row.welcome_email_sent_at),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

export function mapResetToken(row: Record<string, unknown>): PasswordResetTokenRecord {
  return {
    id: asNumber(row.id),
    userId: asNumber(row.user_id),
    tokenHash: asString(row.token_hash),
    expiresAt: asIso(row.expires_at),
    usedAt: asNullableIso(row.used_at),
    createdAt: asIso(row.created_at),
  };
}

export function mapVerificationToken(row: Record<string, unknown>): EmailVerificationTokenRecord {
  return {
    id: asNumber(row.id),
    userId: asNumber(row.user_id),
    tokenHash: asString(row.token_hash),
    expiresAt: asIso(row.expires_at),
    usedAt: asNullableIso(row.used_at),
    createdAt: asIso(row.created_at),
  };
}

export function mapEvent(row: Record<string, unknown>): EventRecord {
  return {
    id: asNumber(row.id),
    title: asString(row.title),
    slug: asString(row.slug),
    description: asString(row.description),
    eventDate: asDateOnly(row.event_date),
    startTime: asTime(row.start_time),
    endTime: asNullableTime(row.end_time),
    location: asString(row.location),
    eventUrl: asString(row.event_url),
    status: asContentStatus(row.status),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
    publishedAt: asNullableIso(row.published_at),
    createdBy: asNumber(row.created_by),
    notifiedAt: asNullableIso(row.notified_at),
  };
}

export function mapNews(row: Record<string, unknown>): NewsRecord {
  return {
    id: asNumber(row.id),
    kind: asNewsKind(row.kind),
    title: asString(row.title),
    slug: asString(row.slug),
    summary: asString(row.summary),
    content: asString(row.content),
    status: asContentStatus(row.status),
    publishedAt: asNullableIso(row.published_at),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
    createdBy: asNumber(row.created_by),
  };
}

export function mapEventNotification(row: Record<string, unknown>): EventNotificationRecord {
  return {
    id: asNumber(row.id),
    eventId: asNumber(row.event_id),
    userId: asNumber(row.user_id),
    email: asString(row.email),
    status: asNotificationStatus(row.status),
    sentAt: asNullableIso(row.sent_at),
    errorMessage: asNullableString(row.error_message),
    createdAt: asIso(row.created_at),
  };
}

export function toPublicMember(user: UserRecord): Member {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    city: user.city,
    postcode: user.postcode,
    heritageNotes: user.heritageNotes,
    membershipStatus: user.membershipStatus,
    membershipNumber: user.membershipNumber,
    eligibilityConfirmed: user.eligibilityConfirmed,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toAdminMember(user: UserRecord): Member {
  return toPublicMember(user);
}

export function toPublicEvent(event: EventRecord) {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    eventUrl: event.eventUrl || null,
    publishedAt: event.publishedAt,
  };
}

export function toAdminEvent(event: EventRecord) {
  return {
    ...toPublicEvent(event),
    status: event.status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    createdBy: event.createdBy,
    notifiedAt: event.notifiedAt,
  };
}

export function toPublicNews(item: NewsRecord) {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    content: item.content,
    publishedAt: item.publishedAt,
  };
}

export function toAdminNews(item: NewsRecord) {
  return {
    ...toPublicNews(item),
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdBy: item.createdBy,
  };
}

export function toAdminNotification(record: EventNotificationRecord) {
  return {
    id: record.id,
    eventId: record.eventId,
    userId: record.userId,
    email: record.email,
    status: record.status,
    sentAt: record.sentAt,
    errorMessage: record.errorMessage,
    createdAt: record.createdAt,
  };
}
