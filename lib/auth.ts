import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";

export const SESSION_COOKIE = "carenest_session";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 30);

/** Hash the opaque session token so a database leak cannot be replayed. */
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createOpaqueToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: string;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  timezone: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  careSessionId: string;
};

/** Resolve the current user from the session cookie. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          avatarUrl: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          timezone: true,
          city: true,
          state: true,
          zip: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  const user = session.user;
  if (user.deletedAt || user.status !== "ACTIVE") return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as Role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt,
    phoneVerifiedAt: user.phoneVerifiedAt,
    timezone: user.timezone,
    city: user.city,
    state: user.state,
    zip: user.zip,
    careSessionId: session.id,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw ApiError.unauthorized();
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw ApiError.forbidden();
  return user;
}

/** Issue a session row + set the HttpOnly cookie. */
export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null } = {}
) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      token: hashToken(token),
      userId,
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .updateMany({
        where: { token: hashToken(token) },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }
  jar.delete(SESSION_COOKIE);
}

/** Brute-force protection: lock an account after repeated failed attempts. */
export async function registerFailedLogin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLogins: true },
  });
  const failedLogins = (user?.failedLogins ?? 0) + 1;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLogins,
      lockedUntil:
        failedLogins >= 8 ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
    },
  });
}

export async function clearFailedLogins(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

export function assertEmailVerified(user: SessionUser) {
  if (!user.emailVerifiedAt) {
    throw new ApiError(
      403,
      "Please verify your email address before using this feature.",
      "email_unverified"
    );
  }
}
