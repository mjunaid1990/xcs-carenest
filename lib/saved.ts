import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth";

/** Shared toggle used by both saved-caregiver and saved-job endpoints. */
export async function toggleSaved(user: SessionUser, kind: "caregiver" | "job", id: string) {
  if (!id) throw ApiError.badRequest("Missing item id.");

  if (kind === "caregiver") {
    if (user.role === "CAREGIVER") throw ApiError.forbidden("Only families and agencies can save caregivers.");
    const existing = await prisma.savedCaregiver.findUnique({
      where: { userId_caregiverId: { userId: user.id, caregiverId: id } },
    });
    if (existing) {
      await prisma.savedCaregiver.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    const caregiver = await prisma.caregiverProfile.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!caregiver) throw ApiError.notFound("Caregiver not found.");
    await prisma.savedCaregiver.create({ data: { userId: user.id, caregiverId: id } });
    return { saved: true };
  }

  const existing = await prisma.savedJob.findUnique({ where: { userId_jobId: { userId: user.id, jobId: id } } });
  if (existing) {
    await prisma.savedJob.delete({ where: { id: existing.id } });
    return { saved: false };
  }
  const job = await prisma.careJob.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!job) throw ApiError.notFound("Job not found.");
  await prisma.savedJob.create({ data: { userId: user.id, jobId: id } });
  return { saved: true };
}
