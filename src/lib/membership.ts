import type { Member, MembershipStatus, UserRole } from "./types";

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  pending: "Pending",
  active: "Active",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  member: "Member",
  admin: "Admin",
};

export function memberName(member: Pick<Member, "firstName" | "lastName">): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

export function displayValue(value: string): string {
  return value.trim() ? value : "Not provided";
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
