export const MEMBERSHIP_STATUSES = ["pending", "active", "rejected", "suspended"] as const;
export const USER_ROLES = ["member", "admin"] as const;
export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export const NEWS_KINDS = ["news", "update", "announcement"] as const;
export const NOTIFICATION_STATUSES = ["pending", "sent", "failed"] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type NewsKind = (typeof NEWS_KINDS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export interface Member {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  postcode: string;
  heritageNotes: string;
  membershipStatus: MembershipStatus;
  membershipNumber: string;
  eligibilityConfirmed: boolean;
  role: UserRole;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  postcode: string;
  heritageNotes: string;
  membershipStatus: MembershipStatus;
  membershipNumber: string;
  eligibilityConfirmed: boolean;
  role: UserRole;
  emailVerifiedAt: string | null;
  welcomeEmailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordResetTokenRecord {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface EmailVerificationTokenRecord {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface EventRecord {
  id: number;
  title: string;
  slug: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string | null;
  location: string;
  eventUrl: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  createdBy: number;
  notifiedAt: string | null;
}

export interface NewsRecord {
  id: number;
  kind: NewsKind;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: ContentStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

export interface EventNotificationRecord {
  id: number;
  eventId: number;
  userId: number;
  email: string;
  status: NotificationStatus;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
