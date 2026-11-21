import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { jobSchema } from "@/lib/validators";
import { listToCsv } from "@/lib/json";

async function ownedJob(id: string, userId: string, isAdmin: boolean) {
  const job = await prisma.careJob.findFirst({ where: { id, deletedAt: null } });
  if (!job) throw ApiError.notFound("Job not found.");
  if (job.ownerId !== userId && !isAdmin) throw ApiError.forbidden();
  return job;
}

export const PATCH = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await ctx.params;
  const job = await ownedJob(id!, user.id, user.role === "ADMIN");
  const body = await readJson<Record<string, unknown>>(req);

  // Lightweight lifecycle change: { status }
  if (typeof body.status === "string" && Object.keys(body).length === 1) {
    const allowed = ["DRAFT", "PUBLISHED", "PAUSED", "FILLED", "CLOSED", "COMPLETED"];
    if (!allowed.includes(body.status)) throw ApiError.badRequest("Unknown job status.");
    const updated = await prisma.careJob.update({
      where: { id: job.id },
      data: {
        status: body.status,
        publishedAt: body.status === "PUBLISHED" ? job.publishedAt ?? new Date() : job.publishedAt,
        filledAt: body.status === "FILLED" ? new Date() : job.filledAt,
      },
      select: { id: true, status: true, slug: true },
    });
    return jsonOk(updated);
  }

  const input = jobSchema.parse(body);
  const category = await prisma.careCategory.findFirst({
    where: { slug: input.categorySlug, isActive: true },
    select: { id: true },
  });
  if (!category) throw ApiError.badRequest("Choose a valid care category.");

  const updated = await prisma.careJob.update({
    where: { id: job.id },
    data: {
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
      status: input.status ?? job.status,
      publishedAt:
        (input.status ?? job.status) === "PUBLISHED" ? job.publishedAt ?? new Date() : job.publishedAt,
    },
    select: { id: true, slug: true, status: true },
  });
  return jsonOk(updated);
});

export const DELETE = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await ctx.params;
  const job = await ownedJob(id!, user.id, user.role === "ADMIN");
  await prisma.careJob.update({ where: { id: job.id }, data: { deletedAt: new Date(), status: "CLOSED" } });
  return jsonOk({ deleted: true });
});
