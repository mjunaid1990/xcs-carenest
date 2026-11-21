import { assertSameOrigin, clientIp, handler, jsonOk, readJson } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { consumeToken } from "@/lib/tokens";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const limit = await rateLimit(`reset:${clientIp(req)}`, 10, 900);
  if (!limit.success) throw ApiError.tooMany("Too many attempts. Try again shortly.");

  const { token, password } = resetPasswordSchema.parse(await readJson(req));

  const consumed = await consumeToken(token, "PASSWORD_RESET");
  if (!consumed) {
    throw ApiError.badRequest("This reset link is invalid or has expired. Request a new one.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: consumed.userId },
      data: { passwordHash, failedLogins: 0, lockedUntil: null },
    }),
    // Sign out every existing session after a password change.
    prisma.session.updateMany({
      where: { userId: consumed.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return jsonOk({ reset: true });
});
