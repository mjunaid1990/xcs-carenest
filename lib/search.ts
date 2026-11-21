import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { csvToList } from "@/lib/json";

/**
 * Caregiver and job discovery queries. All filtering happens in the database —
 * never in the browser and never with mock data.
 */

export const PAGE_SIZE = 12;

export type CaregiverSearchState = {
  type?: string;
  q?: string;
  city?: string;
  state?: string;
  zip?: string;
  radius?: number;
  minRate?: number;
  maxRate?: number;
  experience?: number;
  availability?: "any" | "full_time" | "part_time";
  living?: "any" | "live_in" | "live_out";
  verified?: "any" | "identity" | "background";
  languages?: string;
  certifications?: string;
  minRating?: number;
  sort?: "relevance" | "rating" | "rate_low" | "rate_high" | "experience" | "newest";
  page?: number;
  view?: "grid" | "list" | "map";
};

export function buildCaregiverWhere(params: CaregiverSearchState): Prisma.CaregiverProfileWhereInput {
  const where: Prisma.CaregiverProfileWhereInput = {
    deletedAt: null,
    isPublished: true,
    availableForWork: true,
    user: { status: "ACTIVE", deletedAt: null },
  };

  const and: Prisma.CaregiverProfileWhereInput[] = [];

  if (params.type) {
    and.push({ categories: { some: { category: { slug: params.type, isActive: true } } } });
  }
  if (params.city) {
    and.push({ city: { contains: params.city } });
  }
  if (params.state) {
    and.push({ state: { contains: params.state } });
  }
  if (params.zip) {
    and.push({ zip: { startsWith: params.zip.slice(0, 3) } });
  }
  if (params.q) {
    and.push({
      OR: [
        { headline: { contains: params.q } },
        { bio: { contains: params.q } },
        { skills: { some: { name: { contains: params.q } } } },
        { user: { firstName: { contains: params.q } } },
        { user: { lastName: { contains: params.q } } },
      ],
    });
  }
  if (params.minRate != null) and.push({ hourlyRateCents: { gte: Math.round(params.minRate * 100) } });
  if (params.maxRate != null) and.push({ hourlyRateCents: { lte: Math.round(params.maxRate * 100) } });
  if (params.experience != null) and.push({ yearsExperience: { gte: params.experience } });
  if (params.availability === "full_time") and.push({ employmentType: { in: ["FULL_TIME", "BOTH"] } });
  if (params.availability === "part_time") and.push({ employmentType: { in: ["PART_TIME", "BOTH"] } });
  if (params.living === "live_in") and.push({ livingArrangement: { in: ["LIVE_IN", "BOTH"] } });
  if (params.living === "live_out") and.push({ livingArrangement: { in: ["LIVE_OUT", "BOTH"] } });
  if (params.verified === "identity") and.push({ identityVerifiedAt: { not: null } });
  if (params.verified === "background") and.push({ backgroundCheckAt: { not: null } });
  if (params.minRating != null && params.minRating > 0) and.push({ ratingAvg: { gte: params.minRating } });

  for (const lang of csvToList(params.languages)) {
    and.push({ languages: { contains: lang } });
  }
  if (params.certifications) {
    and.push({
      certifications: { some: { name: { contains: params.certifications } } },
    });
  }

  if (and.length) where.AND = and;
  return where;
}

export function caregiverOrderBy(
  sort: CaregiverSearchState["sort"]
): Prisma.CaregiverProfileOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "rate_low":
      return [{ hourlyRateCents: "asc" }, { ratingAvg: "desc" }];
    case "rate_high":
      return [{ hourlyRateCents: "desc" }, { ratingAvg: "desc" }];
    case "experience":
      return [{ yearsExperience: "desc" }, { ratingAvg: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { ratingAvg: "desc" }, { ratingCount: "desc" }];
  }
}

export const caregiverCardInclude = {
  user: { select: { firstName: true, lastName: true, city: true, state: true, avatarUrl: true } },
  categories: { include: { category: { select: { slug: true, name: true, singular: true } } } },
  skills: { select: { name: true }, take: 6 },
  certifications: { select: { name: true, verifiedAt: true }, take: 4 },
  availability: { select: { dayOfWeek: true, startMinute: true, endMinute: true } },
} satisfies Prisma.CaregiverProfileInclude;

export type CaregiverCard = Prisma.CaregiverProfileGetPayload<{
  include: typeof caregiverCardInclude;
}>;

export async function searchCaregivers(params: CaregiverSearchState) {
  const page = Math.max(1, params.page ?? 1);
  const where = buildCaregiverWhere(params);

  const [total, items] = await Promise.all([
    prisma.caregiverProfile.count({ where }),
    prisma.caregiverProfile.findMany({
      where,
      include: caregiverCardInclude,
      orderBy: caregiverOrderBy(params.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

// ---------------------------------- Jobs -----------------------------------

export type JobSearchState = {
  type?: string;
  q?: string;
  city?: string;
  state?: string;
  employmentType?: string;
  living?: string;
  budgetType?: string;
  minBudget?: number;
  maxBudget?: number;
  sort?: "newest" | "budget_high" | "budget_low";
  page?: number;
};

export function buildJobWhere(params: JobSearchState): Prisma.CareJobWhereInput {
  const where: Prisma.CareJobWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
    owner: { status: "ACTIVE", deletedAt: null },
  };
  const and: Prisma.CareJobWhereInput[] = [];

  if (params.type) and.push({ category: { slug: params.type } });
  if (params.city) and.push({ city: { contains: params.city } });
  if (params.state) and.push({ state: { contains: params.state } });
  if (params.employmentType) and.push({ employmentType: params.employmentType });
  if (params.living) and.push({ livingArrangement: params.living });
  if (params.budgetType) and.push({ budgetType: params.budgetType });
  if (params.minBudget != null) and.push({ budgetMinCents: { gte: Math.round(params.minBudget * 100) } });
  if (params.maxBudget != null) and.push({ budgetMinCents: { lte: Math.round(params.maxBudget * 100) } });
  if (params.q) {
    and.push({
      OR: [
        { title: { contains: params.q } },
        { description: { contains: params.q } },
      ],
    });
  }
  if (and.length) where.AND = and;
  return where;
}

export async function searchJobs(params: JobSearchState) {
  const page = Math.max(1, params.page ?? 1);
  const where = buildJobWhere(params);
  const orderBy: Prisma.CareJobOrderByWithRelationInput[] =
    params.sort === "budget_high"
      ? [{ budgetMinCents: "desc" }, { publishedAt: "desc" }]
      : params.sort === "budget_low"
        ? [{ budgetMinCents: "asc" }, { publishedAt: "desc" }]
        : [{ isFeatured: "desc" }, { publishedAt: "desc" }];

  const [total, items] = await Promise.all([
    prisma.careJob.count({ where }),
    prisma.careJob.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { slug: true, name: true, singular: true } },
        owner: { select: { firstName: true, lastName: true, avatarUrl: true } },
        requirements: { select: { label: true, isRequired: true }, take: 6 },
        agency: { select: { name: true, slug: true } },
      },
    }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
