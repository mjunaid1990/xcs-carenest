import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { interviewResponseSchema } from "@/lib/validators";
import { notify } from "@/lib/notifications";

export const PATCH = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await ctx.params;
  const input = interviewResponseSchema.parse(await readJson(req));

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { job: { select: { title: true } } },
  });
  if (!interview) throw ApiError.notFound("Interview not found.");

  const isFamily = interview.familyId === user.id || user.role === "ADMIN";
  const isCaregiver = interview.caregiverId === user.id;
  if (!isFamily && !isCaregiver) throw ApiError.forbidden();

  if (["ACCEPT", "DECLINE", "RESCHEDULE"].includes(input.action) && !isCaregiver && !isFamily) {
    throw ApiError.forbidden();
  }

  let data: Record<string, unknown> = {};
  let recipientId = isFamily ? interview.caregiverId : interview.familyId;
  let title = "Interview updated";

  switch (input.action) {
    case "ACCEPT":
      data = { status: "ACCEPTED" };
      title = "Interview confirmed";
      break;
    case "DECLINE":
      data = { status: "DECLINED", declineReason: input.reason || null };
      title = "Interview declined";
      break;
    case "CANCEL":
      if (!isFamily) throw ApiError.forbidden("Only the organizer can cancel an interview.");
      data = { status: "CANCELLED", declineReason: input.reason || null };
      title = "Interview cancelled";
      break;
    case "COMPLETE":
      if (!isFamily) throw ApiError.forbidden();
      data = { status: "COMPLETED" };
      title = "Interview completed";
      break;
    case "RESCHEDULE": {
      if (!input.date || !input.time) throw ApiError.badRequest("Choose a new date and time.");
      const scheduledAt = new Date(`${input.date}T${input.time}:00`);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
        throw ApiError.badRequest("Choose a future date and time.");
      }
      data = { status: "RESCHEDULED", scheduledAt };
      recipientId = isFamily ? interview.caregiverId : interview.familyId;
      title = "Interview rescheduled";
      break;
    }
  }

  const updated = await prisma.interview.update({
    where: { id: interview.id },
    data,
    select: { id: true, status: true, scheduledAt: true },
  });

  await notify({
    userId: recipientId,
    type: input.action === "RESCHEDULE" ? "INTERVIEW_UPDATED" : "INTERVIEW_INVITE",
    title,
    body:
      input.action === "RESCHEDULE"
        ? `The interview${interview.job?.title ? ` for “${interview.job.title}”` : ""} was moved to a new time.`
        : input.reason || `Interview${interview.job?.title ? ` for “${interview.job.title}”` : ""} ${updated.status.toLowerCase()}.`,
    link: "/dashboard/interviews",
    email: true,
  });

  return jsonOk(updated);
});
