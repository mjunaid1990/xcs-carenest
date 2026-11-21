import { assertSameOrigin, clientIp, handler, jsonOk, readJson } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import {
  clearFailedLogins,
  createSession,
  registerFailedLogin,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { ROLE_HOME, type Role } from "@/lib/rbac";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const limit = await rateLimit(`login:${ip}`, 12, 300);
  if (!limit.success) {
    throw ApiError.tooMany("Too many sign-in attempts. Please wait a few minutes.");
  }

  const { email, password } = loginSchema.parse(await readJson(req));

  const user = await prisma.user.findUnique({ where: { email } });
  // Always run a comparison to keep timing similar for unknown accounts.
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const passwordOk = await verifyPassword(password, hash).catch(() => false);

  if (!user || !passwordOk) {
    if (user) await registerFailedLogin(user.id);
    throw new ApiError(401, "Email or password is incorrect.", "invalid_credentials");
  }

  if (user.status === "SUSPENDED") {
    throw ApiError.forbidden(
      "This account is suspended. Contact support if you believe this is a mistake."
    );
  }
  if (user.status !== "ACTIVE" || user.deletedAt) {
    throw ApiError.forbidden("This account is not available.");
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw ApiError.forbidden(
      "Too many failed attempts. This account is temporarily locked — try again in 15 minutes."
    );
  }

  await clearFailedLogins(user.id);
  await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") });

  return jsonOk({
    id: user.id,
    role: user.role,
    redirectTo: ROLE_HOME[user.role as Role] ?? "/dashboard",
    emailVerified: Boolean(user.emailVerifiedAt),
  });
});
