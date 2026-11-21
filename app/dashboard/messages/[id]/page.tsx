import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Chat } from "./chat";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          job: { select: { title: true, slug: true } },
        },
      },
    },
  });
  if (!participant) notFound();

  const messages = await prisma.message.findMany({
    where: { conversationId: id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { sender: { select: { firstName: true, lastName: true } } },
  });

  const others = participant.conversation.participants.filter((row) => row.userId !== user.id);
  const other = others[0]?.user;
  const otherName = other ? `${other.firstName} ${other.lastName}` : "CareNest support";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard/messages" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> All messages
          </Link>
          <h1 className="display mt-1 text-2xl">{otherName}</h1>
          {participant.conversation.subject ? (
            <p className="text-xs text-muted-foreground">{participant.conversation.subject}</p>
          ) : null}
          {participant.conversation.job ? (
            <p className="text-xs text-muted-foreground">
              About{" "}
              <Link href={`/care-jobs/${participant.conversation.job.slug}`} className="text-primary hover:underline">
                {participant.conversation.job.title}
              </Link>
            </p>
          ) : null}
        </div>
        {other ? (
          <Link href={user.role === "CAREGIVER" ? `/caregivers/${other.id}` : "/dashboard/messages"} className="text-xs text-muted-foreground">
            &nbsp;
          </Link>
        ) : null}
      </div>

      <Chat
        conversationId={id}
        currentUserId={user.id}
        otherName={otherName}
        initialMessages={messages.map((message) => ({
          id: message.id,
          body: message.body,
          senderId: message.senderId,
          createdAt: message.createdAt.toISOString(),
          attachmentName: message.attachmentName,
          attachmentUrl: message.attachmentUrl,
        }))}
      />
    </div>
  );
}
