import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unreadNotificationCount } from "@/lib/notifications";

export const GET = handler(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    unreadNotificationCount(user.id),
  ]);

  return jsonOk({ notifications, unread });
});

/** Mark one notification or all of them as read. */
export const PATCH = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const body = await readJson<{ id?: string; all?: boolean }>(req);

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  } else if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: user.id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  return jsonOk({ unread: await unreadNotificationCount(user.id) });
});
