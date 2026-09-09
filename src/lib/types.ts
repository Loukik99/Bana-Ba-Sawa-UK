export const MEMBERSHIP_STATUSES = ["pending", "active", "rejected", "suspended"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
export type UserRole = "member" | "admin";

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

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  postcode?: string;
  heritageNotes?: string;
  eligibilityConfirmed: boolean;
}

export interface ProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  postcode?: string;
  heritageNotes?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface FieldErrors {
  [key: string]: string;
}

export interface AdminMemberListResponse {
  members: Member[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminMemberStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  rejected: number;
}
