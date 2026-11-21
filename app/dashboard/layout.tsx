import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");

  const [unreadMessages, unreadNotifications] = await Promise.all([
    prisma.conversationParticipant.count({
      where: {
        userId: user.id,
        isArchived: false,
        conversation: { messages: { some: { senderId: { not: user.id }, readAt: null, deletedAt: null } } },
      },
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return (
    <DashboardShell
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }}
      unreadMessages={unreadMessages}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </DashboardShell>
  );
}
