import { DAY_NAMES, formatMoney, minutesToLabel } from "@/lib/utils";

export function rateLabel(profile: {
  hourlyRateCents: number | null;
  dailyRateCents?: number | null;
  monthlyRateCents?: number | null;
  rateType: string;
}) {
  if (profile.rateType === "MONTHLY") {
    return profile.monthlyRateCents ? `${formatMoney(profile.monthlyRateCents)}/mo` : "Rate on request";
  }
  if (profile.rateType === "DAILY") {
    return profile.dailyRateCents ? `${formatMoney(profile.dailyRateCents)}/day` : "Rate on request";
  }
  return profile.hourlyRateCents ? `${formatMoney(profile.hourlyRateCents)}/hr` : "Rate on request";
}

type AvailabilityRow = { dayOfWeek: number; startMinute: number; endMinute: number };

/** Compact weekly availability, e.g. "Mon–Fri, 8 AM – 6 PM". */
export function availabilitySummary(rows: AvailabilityRow[]) {
  if (!rows.length) return "Availability not set";
  const byDay = new Map<number, AvailabilityRow[]>();
  for (const row of rows) {
    const list = byDay.get(row.dayOfWeek) ?? [];
    list.push(row);
    byDay.set(row.dayOfWeek, list);
  }
  const days = Array.from(byDay.keys()).sort((a, b) => a - b);
  const label = (d: number) => DAY_NAMES[d]!.slice(0, 3);

  // Detect a contiguous Monday–Friday block for a friendlier label.
  const weekdays = [1, 2, 3, 4, 5];
  const isWeekdays = weekdays.every((d) => byDay.has(d)) && days.length === 5;

  const sample = byDay.get(days[0]!)![0]!;
  const times = `${minutesToLabel(sample.startMinute)} – ${minutesToLabel(sample.endMinute)}`;

  if (isWeekdays) return `Mon–Fri, ${times}`;
  if (days.length === 7) return `Every day, ${times}`;
  return `${days.map(label).join(", ")}, ${times}`;
}

export function employmentTypeLabel(value: string) {
  return (
    {
      FULL_TIME: "Full-time",
      PART_TIME: "Part-time",
      BOTH: "Full or part-time",
      OCCASIONAL: "Occasional",
    }[value] ?? value
  );
}

export function livingLabel(value: string) {
  return (
    { LIVE_IN: "Live-in", LIVE_OUT: "Live-out", BOTH: "Live-in or live-out" }[value] ?? value
  );
}

export function budgetLabel(job: {
  budgetType: string;
  budgetMinCents: number;
  budgetMaxCents: number | null;
}) {
  const suffix = job.budgetType === "HOURLY" ? "/hr" : job.budgetType === "DAILY" ? "/day" : "/mo";
  const min = formatMoney(job.budgetMinCents);
  const max = job.budgetMaxCents ? formatMoney(job.budgetMaxCents) : null;
  return max && max !== min ? `${min} – ${max}${suffix}` : `${min}${suffix}`;
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  PAUSED: "Paused",
  FILLED: "Filled",
  CLOSED: "Closed",
  COMPLETED: "Completed",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  REVIEWING: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  HIRED: "Hired",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

export const INTERVIEW_STATUS_LABELS: Record<string, string> = {
  PROPOSED: "Awaiting response",
  ACCEPTED: "Confirmed",
  DECLINED: "Declined",
  RESCHEDULED: "Rescheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  TRIALING: "Trial",
  PAST_DUE: "Past due",
  CANCELED: "Cancelled",
  EXPIRED: "Expired",
};

export const VERIFICATION_LABELS: Record<string, string> = {
  UNVERIFIED: "Not verified",
  PENDING: "Verification pending",
  VERIFIED: "Verified",
  REJECTED: "Verification declined",
};

export const REPORT_REASONS: Record<string, string> = {
  safety_concern: "A safety concern",
  harassment: "Harassment or abuse",
  fake_profile: "Fake profile or identity",
  spam: "Spam or scam",
  discrimination: "Discrimination",
  inappropriate_content: "Inappropriate content",
  other: "Something else",
};
