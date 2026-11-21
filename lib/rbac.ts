export type Role = "FAMILY" | "CAREGIVER" | "AGENCY" | "ADMIN";

export const ROLE_LABELS: Record<Role, string> = {
  FAMILY: "Family",
  CAREGIVER: "Caregiver",
  AGENCY: "Agency",
  ADMIN: "Administrator",
};

export const ROLE_HOME: Record<Role, string> = {
  FAMILY: "/dashboard/family",
  CAREGIVER: "/dashboard/caregiver",
  AGENCY: "/dashboard/agency",
  ADMIN: "/dashboard/admin",
};

export const ROLE_SIGNUP_PATHS = {
  FAMILY: "/register?role=family",
  CAREGIVER: "/register?role=caregiver",
  AGENCY: "/register?role=agency",
} as const;

export function isRole(value: string): value is Role {
  return ["FAMILY", "CAREGIVER", "AGENCY", "ADMIN"].includes(value);
}

export function canAccessDashboard(role: Role, section: string): boolean {
  if (role === "ADMIN") return true;
  const map: Record<string, Role[]> = {
    family: ["FAMILY"],
    caregiver: ["CAREGIVER"],
    agency: ["AGENCY"],
    admin: ["ADMIN"],
  };
  return map[section]?.includes(role) ?? false;
}

/** Admin-only capability groups, used by the admin navigation and API guards. */
export const ADMIN_CAPABILITIES = [
  "users",
  "caregivers",
  "families",
  "agencies",
  "jobs",
  "applications",
  "reviews",
  "reports",
  "verifications",
  "payments",
  "subscriptions",
  "categories",
  "locations",
  "cms",
  "settings",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];
