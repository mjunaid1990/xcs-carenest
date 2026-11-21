import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireRole, assertEmailVerified } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { applicationSchema } from "@/lib/validators";
import { getUsage, limitReached } from "@/lib/subscription";
import { notify } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";

export const POST = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireRole("CAREGIVER");
  assertEmailVerified(user);
  await enforceRateLimit(`apply:${user.id}`, 20, 3600, "You are applying too quickly.");

  // Accept either the job id or its public slug as the path segment.
  const { id } = await ctx.params;
  const job = await prisma.careJob.findFirst({
    where: { OR: [{ id }, { slug: id }], status: "PUBLISHED", deletedAt: null },
    include: { category: { select: { name: true } }, owner: { select: { id: true } } },
  });
  if (!job) throw ApiError.notFound("This job is not accepting applications.");

  const caregiver = await prisma.caregiverProfile.findUnique({ where: { userId: user.id } });
  if (!caregiver) throw ApiError.badRequest("Complete your caregiver profile before applying.");

  const existing = await prisma.jobApplication.findUnique({
    where: { jobId_caregiverId: { jobId: job.id, caregiverId: caregiver.id } },
  });
  if (existing) throw ApiError.conflict("You have already applied to this job.");

  const usage = await getUsage(user.id, user.role);
  const blocked = limitReached(usage.applications, usage.plan.applicationLimit, "application", usage.plan.planName);
  if (blocked) throw ApiError.paymentRequired(blocked);

  const input = applicationSchema.parse(await readJson(req));

  const application = await prisma.$transaction(async (tx) => {
    const created = await tx.jobApplication.create({
      data: {
        jobId: job.id,
        caregiverId: caregiver.id,
        message: input.message,
        expectedRateCents: input.expectedRateCents ?? null,
        availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
      },
    });
    await tx.careJob.update({ where: { id: job.id }, data: { applicationCount: { increment: 1 } } });
    return created;
  });

  await notify({
    userId: job.owner.id,
    type: "NEW_APPLICATION",
    title: "New application received",
    body: `${user.firstName} ${user.lastName} applied for “${job.title}”.`,
    link: `/dashboard/family/jobs/${job.id}/applications`,
    email: true,
  });

  return jsonOk({ id: application.id, status: application.status }, { status: 201 });
});
