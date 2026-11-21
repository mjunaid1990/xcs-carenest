import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { jobSchema } from "@/lib/validators";
import { listToCsv } from "@/lib/json";
import { getUsage, limitReached } from "@/lib/subscription";
import { slugify } from "@/lib/utils";
import { enforceRateLimit } from "@/lib/rate-limit";

async function uniqueSlug(base: string) {
  const root = slugify(base) || "care-job";
  let slug = root;
  for (let i = 2; i < 50; i += 1) {
    const exists = await prisma.careJob.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireRole("FAMILY", "AGENCY", "ADMIN");
  await enforceRateLimit(`jobs:create:${user.id}`, 10, 3600, "You are posting jobs too quickly.");

  const input = jobSchema.parse(await readJson(req));
  const category = await prisma.careCategory.findFirst({
    where: { slug: input.categorySlug, isActive: true },
    select: { id: true },
  });
  if (!category) throw ApiError.badRequest("Choose a valid care category.");

  const usage = await getUsage(user.id, user.role);
  if (input.status === "PUBLISHED") {
    const blocked = limitReached(usage.jobPosts, usage.plan.jobPostLimit, "job post", usage.plan.planName);
    if (blocked) throw ApiError.paymentRequired(blocked);
  }

  const agency = user.role === "AGENCY"
    ? await prisma.agencyProfile.findUnique({ where: { userId: user.id }, select: { id: true } })
    : null;

  const job = await prisma.careJob.create({
    data: {
      slug: await uniqueSlug(input.title),
      ownerId: user.id,
      agencyId: agency?.id ?? null,
      categoryId: category.id,
      title: input.title,
      description: input.description,
      city: input.city,
      state: input.state,
      zip: input.zip || null,
      employmentType: input.employmentType,
      livingArrangement: input.livingArrangement,
      schedule: input.schedule,
      startDate: input.startDate ? new Date(input.startDate) : null,
      durationMonths: input.durationMonths ?? null,
      budgetType: input.budgetType,
      budgetMinCents: Math.round(input.budgetMin * 100),
      budgetMaxCents: input.budgetMax ? Math.round(input.budgetMax * 100) : null,
      caregiversNeeded: input.caregiversNeeded,
      experienceYears: input.experienceYears,
      languages: listToCsv(input.languages),
      certifications: input.certifications || null,
      requirementsText: (input.requirements ?? []).join("\n"),
      status: input.status ?? "DRAFT",
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      requirements: {
        create: (input.requirements ?? []).map((label, index) => ({ label, sortOrder: index })),
      },
    },
    select: { id: true, slug: true, status: true },
  });

  return jsonOk(job, { status: 201 });
});
