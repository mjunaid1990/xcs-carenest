import { prisma } from "@/lib/prisma";

/**
 * Email delivery.
 *
 * Providers, in order of preference:
 *   1. Resend (RESEND_API_KEY)          — HTTPS API, no extra dependency
 *   2. SMTP (SMTP_HOST + credentials)   — via nodemailer if installed
 *   3. Console transport                — development: logs the message
 *
 * Templates are stored in the EmailTemplate table so admins can edit them. When
 * a template is missing the built-in default below is used.
 */

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  templateKey?: string;
  variables?: Record<string, string>;
};

export type EmailResult = { delivered: boolean; provider: string; error?: string };

const BRAND = "CareNest";

export function layoutEmail(title: string, bodyHtml: string, footer = "") {
  return `<!doctype html><html><body style="margin:0;background:#fbf8f3;font-family:Inter,Arial,sans-serif;color:#151b1f">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;color:#0f766e;margin-bottom:24px">${BRAND}</div>
    <div style="background:#ffffff;border:1px solid #eadfd0;border-radius:18px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3">${escapeHtml(title)}</h1>
      ${bodyHtml}
    </div>
    <p style="color:#6b7280;font-size:12px;line-height:1.6;margin-top:20px">
      You are receiving this email because you have a ${BRAND} account.
      ${footer}
    </p>
  </div></body></html>`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

/** Look up an admin-editable template and interpolate it. */
export async function renderTemplate(
  key: string,
  variables: Record<string, string>,
  fallback: { subject: string; title: string; body: string }
) {
  const template = await prisma.emailTemplate
    .findUnique({ where: { key } })
    .catch(() => null);

  if (template?.isActive) {
    return {
      subject: interpolate(template.subject, variables),
      html: layoutEmail(interpolate(template.name, variables), interpolate(template.body, variables)),
    };
  }
  return {
    subject: interpolate(fallback.subject, variables),
    html: layoutEmail(interpolate(fallback.title, variables), interpolate(fallback.body, variables)),
  };
}

export async function sendEmail(args: SendArgs): Promise<EmailResult> {
  const from = process.env.EMAIL_FROM ?? `${BRAND} <hello@carenest.example>`;

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: args.to, subject: args.subject, html: args.html }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("[email] resend rejected", res.status, text.slice(0, 300));
        return { delivered: false, provider: "resend", error: `HTTP ${res.status}` };
      }
      return { delivered: true, provider: "resend" };
    } catch (error) {
      console.error("[email] resend error", error);
      return { delivered: false, provider: "resend", error: "network" };
    }
  }

  if (process.env.SMTP_HOST) {
    try {
      // nodemailer is optional: install it only when SMTP is used.
      const moduleName = "nodemailer";
      const nodemailer = (await import(/* webpackIgnore: true */ moduleName)) as {
        createTransport: (opts: unknown) => {
          sendMail: (opts: unknown) => Promise<unknown>;
        };
      };
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      });
      await transport.sendMail({
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
      });
      return { delivered: true, provider: "smtp" };
    } catch (error) {
      console.error("[email] smtp error", error);
      return { delivered: false, provider: "smtp", error: "smtp_failed" };
    }
  }

  // Development transport: print a short preview instead of pretending to send.
  console.info(
    `[email:dev] to=${args.to} subject="${args.subject}" template=${args.templateKey ?? "none"}`
  );
  return { delivered: false, provider: "console" };
}
