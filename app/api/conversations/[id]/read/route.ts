import { handler, jsonOk, assertSameOrigin } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { publish } from "@/lib/events";

export const POST = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await ctx.params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id!, userId: user.id } },
  });
  if (!participant) throw ApiError.forbidden();

  const now = new Date();
  await prisma.$transaction([
    prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: user.id }, readAt: null },
      data: { readAt: now },
    }),
    prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: now },
    }),
  ]);

  publish([user.id], { type: "read", conversationId: id!, userId: user.id });
  return jsonOk({ readAt: now });
});
