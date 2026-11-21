import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { messageSchema } from "@/lib/validators";
import { publish } from "@/lib/events";
import { notify } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";

async function membership(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw ApiError.forbidden("You are not part of this conversation.");
  return participant;
}

export const GET = handler(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await membership(id!, user.id);

  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const messages = await prisma.message.findMany({
    where: {
      conversationId: id,
      deletedAt: null,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  return jsonOk(messages.reverse());
});

export const POST = handler(async (req, ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { id } = await ctx.params;
  await membership(id!, user.id);
  await enforceRateLimit(`messages:${user.id}`, 60, 60, "You are sending messages too quickly.");

  const input = messageSchema.parse(await readJson(req));

  let attachment: { url: string; name: string; mime: string; size: number } | null = null;
  if (input.attachmentId) {
    const doc = await prisma.uploadedDocument.findFirst({
      where: { id: input.attachmentId, userId: user.id },
    });
    if (!doc) throw ApiError.badRequest("Attachment not found.");
    attachment = { url: doc.id, name: doc.fileName, mime: doc.mimeType, size: doc.sizeBytes };
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: id!,
        senderId: user.id,
        body: input.body,
        attachmentUrl: attachment?.url ?? null,
        attachmentName: attachment?.name ?? null,
        attachmentMime: attachment?.mime ?? null,
        attachmentSize: attachment?.size ?? null,
      },
    });
    await tx.conversation.update({
      where: { id: id! },
      data: { lastMessageAt: new Date(), lastMessagePreview: input.body.slice(0, 160) },
    });
    await tx.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id!, userId: user.id } },
      data: { lastReadAt: new Date() },
    });
    return created;
  });

  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId: id, userId: { not: user.id } },
    select: { userId: true },
  });
  const recipients = participants.map((p) => p.userId);

  publish(recipients, {
    type: "message",
    conversationId: id!,
    messageId: message.id,
    senderId: user.id,
    preview: input.body.slice(0, 120),
  });

  await Promise.all(
    recipients.map((recipientId) =>
      notify({
        userId: recipientId,
        type: "NEW_MESSAGE",
        title: `New message from ${user.firstName}`,
        body: input.body.slice(0, 140),
        link: `/dashboard/messages/${id}`,
        email: true,
      })
    )
  );

  return jsonOk(
    {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      senderId: user.id,
      attachmentName: message.attachmentName,
      attachmentUrl: message.attachmentUrl,
    },
    { status: 201 }
  );
});
