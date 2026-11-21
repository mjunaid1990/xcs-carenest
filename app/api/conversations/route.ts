import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { startConversationSchema } from "@/lib/validators";
import { publish } from "@/lib/events";
import { notify } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";

export const GET = handler(async () => {
  const user = await requireUser();
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId: user.id, isArchived: false },
    orderBy: { conversation: { lastMessageAt: "desc" } },
    include: {
      conversation: {
        include: {
          participants: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } } },
          },
          messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    take: 50,
  });

  return jsonOk(
    participants.map((row) => {
      const conversation = row.conversation;
      const others = conversation.participants.filter((p) => p.userId !== user.id);
      const lastMessage = conversation.messages[0] ?? null;
      return {
        id: conversation.id,
        subject: conversation.subject,
        type: conversation.type,
        jobId: conversation.jobId,
        lastMessageAt: conversation.lastMessageAt,
        lastMessagePreview: conversation.lastMessagePreview,
        unread: Boolean(lastMessage && lastMessage.senderId !== user.id && !lastMessage.readAt),
        participants: others.map((p) => p.user),
        lastMessage: lastMessage
          ? { body: lastMessage.body, senderId: lastMessage.senderId, createdAt: lastMessage.createdAt }
          : null,
      };
    })
  );
});

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await enforceRateLimit(`conversations:${user.id}`, 20, 3600, "You are starting conversations too quickly.");
  const input = startConversationSchema.parse(await readJson(req));

  if (input.recipientId === user.id) throw ApiError.badRequest("You cannot message yourself.");

  const recipient = await prisma.user.findFirst({
    where: { id: input.recipientId, status: "ACTIVE", deletedAt: null },
    select: { id: true, firstName: true, role: true },
  });
  if (!recipient) throw ApiError.notFound("That member could not be found.");

  const blocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: recipient.id },
        { blockerId: recipient.id, blockedId: user.id },
      ],
    },
  });
  if (blocked) throw ApiError.forbidden("You cannot message this member.");

  // Reuse an existing direct conversation between the two members.
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      jobId: input.jobId || null,
      participants: { every: { userId: { in: [user.id, recipient.id] } } },
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: recipient.id } } },
      ],
    },
    select: { id: true },
  });

  const conversationId =
    existing?.id ??
    (
      await prisma.conversation.create({
        data: {
          subject: input.subject || null,
          jobId: input.jobId || null,
          type: input.jobId ? "JOB" : "DIRECT",
          participants: { create: [{ userId: user.id }, { userId: recipient.id }] },
        },
        select: { id: true },
      })
    ).id;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId, senderId: user.id, body: input.message },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), lastMessagePreview: input.message.slice(0, 160) },
    });
    await tx.conversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { lastReadAt: new Date() },
    });
    return created;
  });

  publish([recipient.id], {
    type: "message",
    conversationId,
    messageId: message.id,
    senderId: user.id,
    preview: input.message.slice(0, 120),
  });
  await notify({
    userId: recipient.id,
    type: "NEW_MESSAGE",
    title: `New message from ${user.firstName}`,
    body: input.message.slice(0, 140),
    link: `/dashboard/messages/${conversationId}`,
    email: true,
  });

  return jsonOk({ conversationId, messageId: message.id }, { status: 201 });
});
