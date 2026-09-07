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
  support: "/support",
  events: "/events",
  gallery: "/gallery",
  contact: "/contact",
  privacy: "/privacy-policy",
  documents: "/documents",
  verifyEmail: "/verify-email",
} as const;

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
