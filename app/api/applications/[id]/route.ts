import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { applicationDecisionSchema } from "@/lib/validators";
import { notify } from "@/lib/notifications";
import type { NotificationType } from "@/lib/notifications";

export const PATCH = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await ctx.params;

  const application = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, ownerId: true, slug: true } },
      caregiver: { select: { userId: true, slug: true } },
    },
  });
  if (!application) throw ApiError.notFound("Application not found.");

  const isOwner = application.job.ownerId === user.id || user.role === "ADMIN";
  const isCaregiver = application.caregiver.userId === user.id;

  // Caregivers may only withdraw.
  if (isCaregiver && !isOwner) {
    const body = await readJson<{ status?: string }>(req);
    if (body.status !== "WITHDRAWN") throw ApiError.forbidden("You can only withdraw your application.");
    if (["HIRED", "WITHDRAWN"].includes(application.status)) {
      throw ApiError.conflict("This application can no longer be withdrawn.");
    }
    const updated = await prisma.jobApplication.update({
      where: { id: application.id },
      data: { status: "WITHDRAWN" },
      select: { id: true, status: true },
    });
    await notify({
      userId: application.job.ownerId,
      type: "APPLICATION_REJECTED",
      title: "Application withdrawn",
      body: `An applicant withdrew from “${application.job.title}”.`,
      link: `/dashboard/family/jobs/${application.job.id}/applications`,
    });
    return jsonOk(updated);
  }

  if (!isOwner) throw ApiError.forbidden();

  const input = applicationDecisionSchema.parse(await readJson(req));
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.jobApplication.update({
      where: { id: application.id },
      data: {
        status: input.status,
        shortlistedAt: input.status === "SHORTLISTED" ? now : undefined,
        hiredAt: input.status === "HIRED" ? now : undefined,
        rejectedAt: input.status === "REJECTED" ? now : undefined,
      },
      select: { id: true, status: true },
    });

    if (input.status === "HIRED") {
      const job = await tx.careJob.findUnique({
        where: { id: application.job.id },
        select: { caregiversNeeded: true, _count: { select: { applications: { where: { status: "HIRED" } } } } },
      });
      const hired = job?._count.applications ?? 1;
      if (job && hired >= job.caregiversNeeded) {
        await tx.careJob.update({ where: { id: application.job.id }, data: { status: "FILLED", filledAt: now } });
      }
      await tx.caregiverProfile.update({
        where: { id: application.caregiverId },
        data: { completedHires: { increment: 1 } },
      });
    }
    return next;
  });

  const copy: Record<string, { type: NotificationType; title: string; body: string }> = {
    REVIEWING: { type: "APPLICATION_RECEIVED", title: "Application under review", body: `Your application for “${application.job.title}” is being reviewed.` },
    SHORTLISTED: { type: "APPLICATION_ACCEPTED", title: "You are shortlisted", body: `You were shortlisted for “${application.job.title}”.` },
    INTERVIEW: { type: "INTERVIEW_INVITE", title: "Interview requested", body: `The family would like to interview you for “${application.job.title}”.` },
    HIRED: { type: "APPLICATION_ACCEPTED", title: "You have been hired", body: `Congratulations — you were hired for “${application.job.title}”.` },
    REJECTED: { type: "APPLICATION_REJECTED", title: "Application not selected", body: `Your application for “${application.job.title}” was not selected.` },
  };
  const message = copy[input.status];
  if (message) {
    await notify({
      userId: application.caregiver.userId,
      type: message.type,
      title: message.title,
      body: message.body,
      link: "/dashboard/caregiver/applications",
      email: true,
    });
  }

  return jsonOk(updated);
});
