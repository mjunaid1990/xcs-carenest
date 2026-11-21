import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { interviewSchema } from "@/lib/validators";
import { notify } from "@/lib/notifications";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireRole("FAMILY", "AGENCY");
  const input = interviewSchema.parse(await readJson(req));

  const caregiver = await prisma.caregiverProfile.findFirst({
    where: { userId: input.caregiverId, deletedAt: null },
    select: { userId: true, user: { select: { firstName: true } } },
  });
  if (!caregiver) throw ApiError.notFound("Caregiver not found.");
  if (caregiver.userId === user.id) throw ApiError.badRequest("You cannot interview yourself.");

  if (input.jobId) {
    const job = await prisma.careJob.findFirst({
      where: { id: input.jobId, ownerId: user.id },
      select: { id: true },
    });
    if (!job) throw ApiError.forbidden("You can only schedule interviews for your own jobs.");
  }

  const scheduledAt = new Date(`${input.date}T${input.time}:00`);
  if (Number.isNaN(scheduledAt.getTime())) throw ApiError.badRequest("Choose a valid date and time.");
  if (scheduledAt.getTime() < Date.now() - 60_000) throw ApiError.badRequest("Choose a future date and time.");

  const interview = await prisma.interview.create({
    data: {
      jobId: input.jobId || null,
      applicationId: input.applicationId || null,
      familyId: user.id,
      caregiverId: caregiver.userId,
      createdById: user.id,
      type: input.type,
      scheduledAt,
      durationMinutes: input.durationMinutes,
      timezone: input.timezone,
      location: input.location || null,
      meetingLink: input.meetingLink || null,
      notes: input.notes || null,
      status: "PROPOSED",
    },
    select: { id: true, status: true, scheduledAt: true },
  });

  await notify({
    userId: caregiver.userId,
    type: "INTERVIEW_INVITE",
    title: "Interview invitation",
    body: `${user.firstName} ${user.lastName} invited you to a ${input.durationMinutes}-minute interview.`,
    link: "/dashboard/interviews",
    email: true,
  });

  return jsonOk(interview, { status: 201 });
});
