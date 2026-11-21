import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { MarkAllRead } from "@/components/dashboard/mark-all-read";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((item) => !item.isRead).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Notifications"
          description={unread ? `${unread} unread notification${unread === 1 ? "" : "s"}.` : "You are all caught up."}
        />
        <MarkAllRead disabled={!unread} />
      </div>

      {!notifications.length ? (
        <EmptyState title="Nothing here yet" description="Applications, messages, interviews and billing updates appear here." />
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-white shadow-soft">
          {notifications.map((notification) => {
            const content = (
              <div className={`px-4 py-3.5 ${notification.isRead ? "" : "bg-primary/[0.04]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(notification.createdAt)}</span>
                </div>
                {notification.body ? <p className="mt-1 text-[13px] leading-6 text-ink-500">{notification.body}</p> : null}
                {!notification.isRead ? <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">New</span> : null}
              </div>
            );
            return (
              <li key={notification.id}>
                {notification.link ? (
                  <Link href={notification.link} className="block hover:bg-sand-50">{content}</Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
