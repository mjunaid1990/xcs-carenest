import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/events";
import { layoutEmail, sendEmail } from "@/lib/email";

export type NotificationType =
  | "WELCOME"
  | "EMAIL_VERIFIED"
  | "NEW_APPLICATION"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_RECEIVED"
  | "NEW_MESSAGE"
  | "INTERVIEW_INVITE"
  | "INTERVIEW_REMINDER"
  | "INTERVIEW_UPDATED"
  | "JOB_STATUS"
  | "SUBSCRIPTION"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "VERIFICATION"
  | "NEW_REVIEW"
  | "REPORT_UPDATE"
  | "ADMIN_NOTICE";

type CreateArgs = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  email?: boolean;
  emailSubject?: string;
  emailBodyHtml?: string;
};

/**
 * Create an in-app notification, broadcast it over the SSE bus and optionally
 * send an email — respecting the recipient's notification preferences.
 */
export async function notify({
  userId,
  type,
  title,
  body,
  link,
  email = false,
  emailSubject,
  emailBodyHtml,
}: CreateArgs) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      status: true,
      notificationPrefs: true,
    },
  });
  if (!user || user.status !== "ACTIVE") return null;

  const prefs = user.notificationPrefs;
  const inAppEnabled = prefs?.inAppEnabled ?? true;

  const notification = inAppEnabled
    ? await prisma.notification.create({
        data: { userId, type, title, body: body ?? null, link: link ?? null },
      })
    : null;

  if (notification) {
    publish([userId], {
      type: "notification",
      notificationId: notification.id,
      title: notification.title,
    });
  }

  if (email) {
    const emailAllowed = emailPreferenceFor(type, prefs);
    if (emailAllowed) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const html =
        emailBodyHtml ??
        layoutEmail(
          title,
          `<p style="margin:0 0 16px;color:#374151;line-height:1.6">${body ?? ""}</p>
           ${link ? `<p style="margin:0"><a href="${appUrl}${link}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Open CareNest</a></p>` : ""}`
        );
      await sendEmail({
        to: user.email,
        subject: emailSubject ?? title,
        html,
        templateKey: type,
      });
      await prisma.notification
        .update({
          where: { id: notification?.id ?? "__none__" },
          data: { emailedAt: new Date() },
        })
        .catch(() => undefined);
    }
  }

  return notification;
}

function emailPreferenceFor(
  type: NotificationType,
  prefs: {
    emailApplications: boolean;
    emailMessages: boolean;
    emailInterviews: boolean;
    emailBilling: boolean;
    emailReviews: boolean;
  } | null
) {
  if (!prefs) return true;
  switch (type) {
    case "NEW_MESSAGE":
      return prefs.emailMessages;
    case "NEW_APPLICATION":
    case "APPLICATION_ACCEPTED":
    case "APPLICATION_REJECTED":
    case "APPLICATION_RECEIVED":
      return prefs.emailApplications;
    case "INTERVIEW_INVITE":
    case "INTERVIEW_REMINDER":
    case "INTERVIEW_UPDATED":
      return prefs.emailInterviews;
    case "SUBSCRIPTION":
    case "PAYMENT_SUCCESS":
    case "PAYMENT_FAILED":
      return prefs.emailBilling;
    case "NEW_REVIEW":
      return prefs.emailReviews;
    default:
      return true;
  }
}

/** Count of unread in-app notifications for the header badge. */
export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}
