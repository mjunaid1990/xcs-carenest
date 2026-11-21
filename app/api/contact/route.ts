import { handler, jsonOk, assertSameOrigin, readJson, clientIp } from "@/lib/api";
import { contactSchema } from "@/lib/validators";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sendEmail, escapeHtml } from "@/lib/email";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  await enforceRateLimit(`contact:${clientIp(req)}`, 5, 60 * 60, "Too many messages. Please try again later.");

  const input = contactSchema.parse(await readJson(req));

  await sendEmail({
    to: process.env.SUPPORT_EMAIL ?? "support@carenest.example",
    subject: `[CareNest ${input.topic}] Message from ${input.name}`,
    html: `<p><strong>${escapeHtml(input.name)}</strong> &lt;${escapeHtml(input.email)}&gt;</p>
<p><strong>Topic:</strong> ${escapeHtml(input.topic)}</p>
<p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
    templateKey: "CONTACT",
  });

  return jsonOk({ received: true });
});
