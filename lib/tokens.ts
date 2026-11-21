import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export type TokenType = "EMAIL_VERIFY" | "PASSWORD_RESET" | "PHONE_OTP";

/** Issue a single-use token; any previous unused token of the same type is revoked. */
export async function issueToken(userId: string, type: TokenType, ttlMinutes = 60 * 24) {
  await prisma.verificationToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId,
      type,
      token: crypto.createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    },
  });
  return token;
}

export type ConsumedToken = {
  id: string;
  userId: string;
};

/** Validate and consume a token, returning the owning user or null. */
export async function consumeToken(token: string, type: TokenType): Promise<ConsumedToken | null> {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const row = await prisma.verificationToken.findUnique({ where: { token: hashed } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) return null;

  await prisma.verificationToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return { id: row.id, userId: row.userId };
}

/** Peek at a token without consuming it (used to render reset forms). */
export async function peekToken(token: string, type: TokenType) {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const row = await prisma.verificationToken.findUnique({ where: { token: hashed } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) return null;
  return row;
}
