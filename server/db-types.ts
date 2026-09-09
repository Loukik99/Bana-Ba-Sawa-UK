import type {
  ContentStatus,
  EmailVerificationTokenRecord,
  EventNotificationRecord,
  EventRecord,
  Member,
  MembershipStatus,
  NewsKind,
  NewsRecord,
  NotificationStatus,
  PasswordResetTokenRecord,
  UserRecord,
  UserRole,
} from "./types.js";

export type DatabaseKind = "sqlite" | "postgres";

export interface InsertUserValues {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  postcode: string;
  heritageNotes: string;
  eligibilityConfirmed: boolean;
  role?: UserRole;
}

export interface UpdateUserValues {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  postcode: string;
  heritageNotes: string;
  passwordHash?: string;
}

export interface InsertResetTokenValues {
  userId: number;
  tokenHash: string;
  expiresAt: string;
}

export interface InsertVerificationTokenValues {
  userId: number;
  tokenHash: string;
  expiresAt: string;
}

export interface MemberListQuery {
  status?: MembershipStatus;
  search?: string;
  page: number;
  pageSize: number;
  offset: number;
}

export interface InsertEventValues {
  title: string;
  slug: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string | null;
  location: string;
  eventUrl: string;
  createdBy: number;
}

export interface UpdateEventValues {
  title: string;
  slug: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string | null;
  location: string;
  eventUrl: string;
}

export interface EventListQuery {
  status?: ContentStatus;
  page: number;
  pageSize: number;
  offset: number;
}

export interface InsertNewsValues {
  kind: NewsKind;
  title: string;
  slug: string;
  summary: string;
  content: string;
  createdBy: number;
}

export interface UpdateNewsValues {
  kind: NewsKind;
  title: string;
  slug: string;
  summary: string;
  content: string;
}

export interface NewsListQuery {
  kind?: NewsKind;
  status?: ContentStatus;
  page: number;
  pageSize: number;
  offset: number;
}

export interface InsertNotificationValues {
  eventId: number;
  userId: number;
  email: string;
}

export interface AppDatabase {
  kind: DatabaseKind;
  healthCheck(): Promise<void>;
  findUserByEmail(email: string): Promise<UserRecord | undefined>;
  findUserById(id: number): Promise<UserRecord | undefined>;
  insertUser(values: InsertUserValues): Promise<UserRecord>;
  updateUser(id: number, values: UpdateUserValues): Promise<UserRecord>;
  updateUserMembershipStatus(id: number, status: MembershipStatus): Promise<UserRecord>;
  updateUserRole(id: number, role: UserRole): Promise<UserRecord>;
  markEmailVerified(id: number): Promise<UserRecord>;
  clearEmailVerified(id: number): Promise<void>;
  markWelcomeEmailSent(id: number): Promise<boolean>;
  countUsersByRole(role: UserRole): Promise<number>;
  listMembers(query: MemberListQuery): Promise<{ items: UserRecord[]; total: number }>;
  listEligibleNotificationRecipients(): Promise<UserRecord[]>;
  createSession(userId: number, sessionToken: string, expiresAt: string): Promise<void>;
  findValidSession(sessionToken: string): Promise<{ user: UserRecord; expiresAt: string } | undefined>;
  deleteSession(sessionToken: string): Promise<void>;
  hasStoredSessionId(storedId: string): Promise<boolean>;
  deleteExpiredSessions(): Promise<void>;
  deleteSessionsForUser(userId: number): Promise<void>;
  updatePasswordHash(userId: number, passwordHash: string): Promise<void>;
  insertPasswordResetToken(values: InsertResetTokenValues): Promise<number>;
  findPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetTokenRecord | undefined>;
  markPasswordResetTokenUsed(id: number): Promise<void>;
  invalidatePasswordResetTokensForUser(userId: number): Promise<void>;
  insertEmailVerificationToken(values: InsertVerificationTokenValues): Promise<number>;
  findEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationTokenRecord | undefined>;
  markEmailVerificationTokenUsed(id: number): Promise<void>;
  invalidateEmailVerificationTokensForUser(userId: number): Promise<void>;
  eventSlugExists(slug: string, excludeId?: number): Promise<boolean>;
  insertEvent(values: InsertEventValues): Promise<EventRecord>;
  updateEvent(id: number, values: UpdateEventValues): Promise<EventRecord>;
  findEventById(id: number): Promise<EventRecord | undefined>;
  findEventBySlug(slug: string): Promise<EventRecord | undefined>;
  listPublishedEvents(query: EventListQuery): Promise<{ items: EventRecord[]; total: number }>;
  listAdminEvents(query: EventListQuery): Promise<{ items: EventRecord[]; total: number }>;
  publishEvent(id: number): Promise<EventRecord>;
  archiveEvent(id: number): Promise<EventRecord>;
  markEventNotified(id: number): Promise<void>;
  newsSlugExists(slug: string, excludeId?: number): Promise<boolean>;
  insertNews(values: InsertNewsValues): Promise<NewsRecord>;
  updateNews(id: number, values: UpdateNewsValues): Promise<NewsRecord>;
  findNewsById(id: number): Promise<NewsRecord | undefined>;
  findNewsBySlug(slug: string): Promise<NewsRecord | undefined>;
  listPublishedNews(query: NewsListQuery): Promise<{ items: NewsRecord[]; total: number }>;
  listAdminNews(query: NewsListQuery): Promise<{ items: NewsRecord[]; total: number }>;
  publishNews(id: number): Promise<NewsRecord>;
  archiveNews(id: number): Promise<NewsRecord>;
  insertEventNotifications(values: InsertNotificationValues[]): Promise<number>;
  resetFailedEventNotifications(eventId: number): Promise<void>;
  listPendingEventNotifications(eventId: number): Promise<EventNotificationRecord[]>;
  listEventNotifications(eventId: number): Promise<EventNotificationRecord[]>;
  markNotificationSent(id: number): Promise<void>;
  markNotificationFailed(id: number, errorMessage: string): Promise<void>;
  close(): Promise<void>;
}

export type { Member, PasswordResetTokenRecord, UserRecord };
export type { ContentStatus, MembershipStatus, NewsKind, NotificationStatus, UserRole };
