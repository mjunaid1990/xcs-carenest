import { assertSameOrigin, handler, jsonOk } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { issueToken } from "@/lib/tokens";
import { renderTemplate, sendEmail } from "@/lib/email";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();

  if (user.emailVerifiedAt) {
    return jsonOk({ sent: false, alreadyVerified: true });
  }

  const limit = await rateLimit(`resend-verify:${user.id}`, 3, 900);
  if (!limit.success) throw ApiError.tooMany("Please wait before requesting another email.");

  const token = await issueToken(user.id, "EMAIL_VERIFY", 60 * 24);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const account = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { email: true, firstName: true },
  });

  const template = await renderTemplate(
    "VERIFY_EMAIL",
    { firstName: account.firstName, token, appUrl },
    {
      subject: "Confirm your CareNest email address",
      title: "Confirm your email address",
      body: `<p style="margin:0 0 16px;color:#374151;line-height:1.6">Hi {{firstName}}, here is a fresh verification link.</p>
      <p style="margin:0 0 16px"><a href="{{appUrl}}/verify-email/{{token}}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Verify my email</a></p>`,
    }
  );

  await sendEmail({
    to: account.email,
    subject: template.subject,
    html: template.html,
    templateKey: "VERIFY_EMAIL",
  });

  return jsonOk({ sent: true });
});
