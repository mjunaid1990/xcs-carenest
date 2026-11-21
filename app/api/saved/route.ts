import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

/** Toggle a saved caregiver or job for the signed-in user. */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { kind, id } = await readJson<{ kind: "caregiver" | "job"; id: string }>(req);
  if (!id || !["caregiver", "job"].includes(kind)) throw ApiError.badRequest("Invalid saved item.");

  if (kind === "caregiver") {
    if (user.role === "CAREGIVER") throw ApiError.forbidden("Only families and agencies can save caregivers.");
    const existing = await prisma.savedCaregiver.findUnique({
      where: { userId_caregiverId: { userId: user.id, caregiverId: id } },
    });
    if (existing) {
      await prisma.savedCaregiver.delete({ where: { id: existing.id } });
      return jsonOk({ saved: false });
    }
    const caregiver = await prisma.caregiverProfile.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!caregiver) throw ApiError.notFound("Caregiver not found.");
    await prisma.savedCaregiver.create({ data: { userId: user.id, caregiverId: id } });
    return jsonOk({ saved: true });
  }

  const existing = await prisma.savedJob.findUnique({ where: { userId_jobId: { userId: user.id, jobId: id } } });
  if (existing) {
    await prisma.savedJob.delete({ where: { id: existing.id } });
    return jsonOk({ saved: false });
  }
  const job = await prisma.careJob.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!job) throw ApiError.notFound("Job not found.");
  await prisma.savedJob.create({ data: { userId: user.id, jobId: id } });
  return jsonOk({ saved: true });
});
