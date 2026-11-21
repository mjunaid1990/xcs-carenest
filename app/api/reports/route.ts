import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await enforceRateLimit(`reports:${user.id}`, 10, 24 * 3600, "You have submitted several reports recently.");

  const input = reportSchema.parse(await readJson(req));

  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: input.targetType,
      targetUserId: input.targetUserId || null,
      targetJobId: input.targetJobId || null,
      targetReviewId: input.targetReviewId || null,
      reason: input.reason,
      details: input.details,
    },
  });

  void audit({
    actorId: user.id,
    action: "report.create",
    entityType: "Report",
    entityId: report.id,
    metadata: { targetType: input.targetType, reason: input.reason },
  });

  return jsonOk({ id: report.id, status: report.status }, { status: 201 });
});
