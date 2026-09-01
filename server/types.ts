export const MEMBERSHIP_STATUSES = ["pending", "active", "inactive"] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

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
