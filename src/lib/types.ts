export type MembershipStatus = "pending" | "active" | "inactive";

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
