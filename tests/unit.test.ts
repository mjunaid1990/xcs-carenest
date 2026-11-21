import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyRange, initials, minutesToLabel, pluralize, slugify, truncate } from "../lib/utils";
import { canAccessDashboard, isRole, ROLE_HOME } from "../lib/rbac";
import { limitReached } from "../lib/subscription";
import { parseJson, stringifyJson } from "../lib/json";

describe("money formatting", () => {
  it("formats whole dollars without decimals", () => {
    expect(formatMoney(2900)).toBe("$29");
  });
  it("formats cents when needed", () => {
    expect(formatMoney(2950)).toBe("$29.50");
  });
  it("handles missing values", () => {
    expect(formatMoney(null)).toBe("—");
  });
  it("formats ranges", () => {
    expect(formatMoneyRange(2200, 2800)).toContain("$22");
  });
});

describe("text helpers", () => {
  it("slugifies accents and punctuation", () => {
    expect(slugify("Zoë's Full-Time Nanny!")).toBe("zoes-full-time-nanny");
  });
  it("builds initials with a fallback", () => {
    expect(initials("Sarah", "Lee")).toBe("SL");
    expect(initials()).toBe("CN");
  });
  it("truncates on a word boundary", () => {
    expect(truncate("Care for two children after school", 12)).toBe("Care for…");
  });
  it("pluralizes", () => {
    expect(pluralize(1, "job")).toBe("1 job");
    expect(pluralize(3, "job")).toBe("3 jobs");
  });
  it("converts minutes to 12-hour labels", () => {
    expect(minutesToLabel(9 * 60)).toBe("9 AM");
    expect(minutesToLabel(15 * 60 + 30)).toBe("3:30 PM");
  });
});

describe("rbac", () => {
  it("recognises roles", () => {
    expect(isRole("CAREGIVER")).toBe(true);
    expect(isRole("OWNER")).toBe(false);
  });
  it("routes roles to their dashboards", () => {
    expect(ROLE_HOME.ADMIN).toBe("/dashboard/admin");
  });
  it("scopes dashboard sections by role", () => {
    expect(canAccessDashboard("ADMIN", "admin")).toBe(true);
    expect(canAccessDashboard("FAMILY", "admin")).toBe(false);
  });
});

describe("plan limits", () => {
  it("allows usage below the limit", () => {
    expect(limitReached(1, 3, "application", "Free")).toBeNull();
  });
  it("blocks usage at the limit", () => {
    expect(limitReached(3, 3, "application", "Free")).toContain("Free plan");
  });
  it("treats null as unlimited", () => {
    expect(limitReached(999, null, "contact", "Pro")).toBeNull();
  });
});

describe("json helpers", () => {
  it("round-trips an array", () => {
    expect(parseJson<string[]>(stringifyJson(["a", "b"]), [])).toEqual(["a", "b"]);
  });
  it("falls back on invalid input", () => {
    expect(parseJson<number[]>("not json", [])).toEqual([]);
  });
});
