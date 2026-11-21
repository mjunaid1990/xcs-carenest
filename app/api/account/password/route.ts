import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { changePasswordSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await enforceRateLimit(`password:${user.id}`, 5, 3600, "Too many password attempts.");

  const input = changePasswordSchema.parse(await readJson(req));
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record) throw ApiError.notFound();

  const valid = await verifyPassword(input.currentPassword, record.passwordHash);
  if (!valid) throw ApiError.badRequest("Your current password is incorrect.");

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.password) } }),
    prisma.session.updateMany({
      where: { userId: user.id, id: { not: user.careSessionId } },
      data: { revokedAt: new Date() },
    }),
  ]);

  return jsonOk({ updated: true });
});
