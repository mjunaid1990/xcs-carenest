import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { reviewSchema } from "@/lib/validators";
import { notify } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireRole("FAMILY", "AGENCY");
  await enforceRateLimit(`reviews:${user.id}`, 10, 3600, "You are posting reviews too quickly.");

  const input = reviewSchema.parse(await readJson(req));

  const application = await prisma.jobApplication.findUnique({
    where: { id: input.applicationId },
    include: { job: { select: { id: true, ownerId: true, title: true } }, caregiver: true },
  });
  if (!application) throw ApiError.notFound("Hire not found.");
  if (application.job.ownerId !== user.id) throw ApiError.forbidden("You can only review your own hires.");
  if (application.status !== "HIRED") {
    throw ApiError.badRequest("Reviews unlock after a hire is confirmed.");
  }

  const existing = await prisma.review.findUnique({
    where: { authorId_applicationId: { authorId: user.id, applicationId: application.id } },
  });
  if (existing) throw ApiError.conflict("You have already reviewed this hire.");

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        authorId: user.id,
        caregiverId: application.caregiverId,
        jobId: application.jobId,
        applicationId: application.id,
        rating: input.rating,
        title: input.title || null,
        body: input.body,
        isVerified: true,
        status: "PUBLISHED",
      },
    });

    const aggregate = await tx.review.aggregate({
      where: { caregiverId: application.caregiverId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.caregiverProfile.update({
      where: { id: application.caregiverId },
      data: {
        ratingAvg: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
        ratingCount: aggregate._count.rating,
      },
    });

    return created;
  });

  await notify({
    userId: application.caregiver.userId,
    type: "NEW_REVIEW",
    title: "You received a new review",
    body: `${user.firstName} rated their experience ${input.rating}/5 for “${application.job.title}”.`,
    link: `/caregivers/${application.caregiver.slug}#reviews`,
    email: true,
  });

  return jsonOk({ id: review.id, status: review.status }, { status: 201 });
});
