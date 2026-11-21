import { assertSameOrigin, clientIp, handler, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { issueToken } from "@/lib/tokens";
import { renderTemplate, sendEmail } from "@/lib/email";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const limit = await rateLimit(`forgot:${ip}`, 5, 900);
  if (!limit.success) return jsonOk({ sent: true });

  const { email } = forgotPasswordSchema.parse(await readJson(req));
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way so the endpoint cannot be used to discover accounts.
  if (user && user.status === "ACTIVE") {
    const token = await issueToken(user.id, "PASSWORD_RESET", 60);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const template = await renderTemplate(
      "PASSWORD_RESET",
      { firstName: user.firstName, token, appUrl },
      {
        subject: "Reset your CareNest password",
        title: "Reset your password",
        body: `<p style="margin:0 0 16px;color:#374151;line-height:1.6">Hi {{firstName}}, we received a request to reset your password. This link expires in one hour.</p>
        <p style="margin:0 0 16px"><a href="{{appUrl}}/reset-password/{{token}}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Choose a new password</a></p>
        <p style="margin:0;color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email.</p>`,
      }
    );
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      templateKey: "PASSWORD_RESET",
    });
  }

  return jsonOk({ sent: true });
});
