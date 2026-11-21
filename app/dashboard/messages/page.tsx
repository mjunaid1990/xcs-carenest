import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireUser();
  const rows = await prisma.conversationParticipant.findMany({
    where: { userId: user.id, isArchived: false },
    orderBy: { conversation: { lastMessageAt: "desc" } },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } },
          messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader title="Messages" description="All your conversations with families, caregivers and agencies." />
      {!rows.length ? (
        <EmptyState
          title="No conversations yet"
          description="Start a conversation from a caregiver profile or a job listing."
          action={{ href: "/search", label: "Find caregivers" }}
        />
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-white shadow-soft">
          {rows.map((row) => {
            const others = row.conversation.participants.filter((p) => p.userId !== user.id);
            const person = others[0]?.user;
            const last = row.conversation.messages[0];
            const unread = Boolean(last && last.senderId !== user.id && !last.readAt);
            return (
              <li key={row.id}>
                <Link href={`/dashboard/messages/${row.conversation.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-sand-50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs">
                      {initials(person?.firstName, person?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {person ? `${person.firstName} ${person.lastName}` : "CareNest support"}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(row.conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className={`truncate text-xs ${unread ? "font-semibold text-ink-900" : "text-muted-foreground"}`}>
                      {row.conversation.lastMessagePreview ?? "No messages yet"}
                    </p>
                    {row.conversation.subject ? (
                      <p className="truncate text-[11px] text-muted-foreground">{row.conversation.subject}</p>
                    ) : null}
                  </div>
                  {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
