import type { UserRole } from "./types";

export const ROUTES = {
  home: "/",
  about: "/about",
  community: "/community",
  membership: "/membership",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  portal: "/portal",
  profile: "/portal/profile",
  admin: "/admin",
  adminMembers: "/admin/members",
  support: "/support",
  events: "/events",
  gallery: "/gallery",
  contact: "/contact",
  privacy: "/privacy-policy",
  documents: "/documents",
  verifyEmail: "/verify-email",
} as const;

export function adminMemberPath(id: number | string): string {
  return `${ROUTES.adminMembers}/${id}`;
}

export function homePathForRole(role: UserRole): string {
  return role === "admin" ? ROUTES.admin : ROUTES.portal;
}

export interface NavItem {
  label: string;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: ROUTES.home },
  { label: "About Us", path: ROUTES.about },
  { label: "Community", path: ROUTES.community },
  { label: "Membership", path: ROUTES.membership },
];
