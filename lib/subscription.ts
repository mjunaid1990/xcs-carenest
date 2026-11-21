import { prisma } from "@/lib/prisma";

/**
 * Subscription + entitlement logic.
 *
 * Prices and limits are never hardcoded: they come from SubscriptionPlan rows
 * that administrators edit. A user without an active paid plan falls back to
 * the free plan for their audience.
 */

export type PlanLimits = {
  planId: string;
  planSlug: string;
  planName: string;
  searchLimit: number | null;
  applicationLimit: number | null;
  contactLimit: number | null;
  jobPostLimit: number | null;
  isPaid: boolean;
};

export type ActiveSubscription = {
  id: string;
  status: string;
  interval: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    slug: string;
    name: string;
    audience: string;
    priceMonthlyCents: number;
    priceAnnualCents: number;
    features: string;
    searchLimit: number | null;
    applicationLimit: number | null;
    contactLimit: number | null;
    jobPostLimit: number | null;
    isPopular: boolean;
    tagline: string | null;
    trialDays: number;
    stripePriceMonthlyId: string | null;
    stripePriceAnnualId: string | null;
  };
};

export async function getActiveSubscription(userId: string): Promise<ActiveSubscription | null> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
      currentPeriodEnd: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
  return sub as ActiveSubscription | null;
}

export function audienceForRole(role: string): "FAMILY" | "CAREGIVER" | "AGENCY" {
  if (role === "CAREGIVER") return "CAREGIVER";
  if (role === "AGENCY") return "AGENCY";
  return "FAMILY";
}

export async function getPlanForUser(userId: string, role: string): Promise<PlanLimits> {
  const active = await getActiveSubscription(userId);
  if (active) {
    return {
      planId: active.plan.id,
      planSlug: active.plan.slug,
      planName: active.plan.name,
      searchLimit: active.plan.searchLimit,
      applicationLimit: active.plan.applicationLimit,
      contactLimit: active.plan.contactLimit,
      jobPostLimit: active.plan.jobPostLimit,
      isPaid: active.plan.priceMonthlyCents > 0 || active.plan.priceAnnualCents > 0,
    };
  }

  const free = await prisma.subscriptionPlan.findFirst({
    where: { audience: audienceForRole(role), isActive: true, priceMonthlyCents: 0 },
    orderBy: { sortOrder: "asc" },
  });

  return {
    planId: free?.id ?? "free",
    planSlug: free?.slug ?? "free",
    planName: free?.name ?? "Free",
    searchLimit: free?.searchLimit ?? 10,
    applicationLimit: free?.applicationLimit ?? 3,
    contactLimit: free?.contactLimit ?? 0,
    jobPostLimit: free?.jobPostLimit ?? 1,
    isPaid: false,
  };
}

function periodStart(sub: ActiveSubscription | null) {
  // Usage is measured per billing period; the free plan uses a rolling 30 days.
  if (sub) {
    const start = new Date(sub.currentPeriodEnd);
    start.setMonth(start.getMonth() - (sub.interval === "ANNUAL" ? 12 : 1));
    return start;
  }
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

export type UsageSummary = {
  applications: number;
  jobPosts: number;
  contacts: number;
  plan: PlanLimits;
};

export async function getUsage(userId: string, role: string): Promise<UsageSummary> {
  const [plan, sub] = await Promise.all([
    getPlanForUser(userId, role),
    getActiveSubscription(userId),
  ]);
  const since = periodStart(sub);

  const caregiver = await prisma.caregiverProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  const [applications, jobPosts, contacts] = await Promise.all([
    caregiver
      ? prisma.jobApplication.count({
          where: { caregiverId: caregiver.id, createdAt: { gte: since } },
        })
      : Promise.resolve(0),
    prisma.careJob.count({
      where: { ownerId: userId, createdAt: { gte: since }, deletedAt: null },
    }),
    prisma.conversation.count({
      where: { participants: { some: { userId } }, createdAt: { gte: since } },
    }),
  ]);

  return { applications, jobPosts, contacts, plan };
}

/** Returns a human-readable reason when the action is blocked, otherwise null. */
export function limitReached(
  used: number,
  limit: number | null,
  label: string,
  planName: string
): string | null {
  if (limit == null) return null;
  if (used < limit) return null;
  return `You have reached your ${label} limit (${limit}) on the ${planName} plan. Upgrade to continue.`;
}
