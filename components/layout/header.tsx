import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeaderNav, type HeaderCategory, type HeaderUser } from "@/components/layout/header-nav";

export async function SiteHeader() {
  const user = await getSessionUser();

  const [categories, unreadMessages, unreadNotifications] = await Promise.all([
    prisma.careCategory.findMany({
      where: { isActive: true, isCareType: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, shortName: true },
    }),
    user
      ? prisma.conversationParticipant.count({
          where: {
            userId: user.id,
            isArchived: false,
            conversation: {
              messages: { some: { senderId: { not: user.id }, readAt: null, deletedAt: null } },
            },
          },
        })
      : Promise.resolve(0),
    user
      ? prisma.notification.count({ where: { userId: user.id, isRead: false } })
      : Promise.resolve(0),
  ]);

  const headerUser: HeaderUser = user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        unreadMessages,
        unreadNotifications,
      }
    : null;

  return <HeaderNav user={headerUser} categories={categories as HeaderCategory[]} />;
}
