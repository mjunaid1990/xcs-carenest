import { assertSameOrigin, clientIp, handler, jsonOk, readJson } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { issueToken } from "@/lib/tokens";
import { renderTemplate, sendEmail } from "@/lib/email";
import { listToCsv } from "@/lib/json";
import { notify } from "@/lib/notifications";
import { slugify } from "@/lib/utils";
import { ROLE_HOME } from "@/lib/rbac";

const ROLE_MAP = { family: "FAMILY", caregiver: "CAREGIVER", agency: "AGENCY" } as const;

async function uniqueCaregiverSlug(base: string) {
  const root = slugify(base) || "caregiver";
  let candidate = root;
  let suffix = 1;
  // Slugs are public URLs, so collisions must be resolved deterministically.
  while (await prisma.caregiverProfile.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
  return candidate;
}

async function uniqueAgencySlug(base: string) {
  const root = slugify(base) || "agency";
  let candidate = root;
  let suffix = 1;
  while (await prisma.agencyProfile.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
  return candidate;
}

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const limit = await rateLimit(`register:${ip}`, 5, 3600);
  if (!limit.success) throw ApiError.tooMany("Too many sign-up attempts. Try again later.");

  const body = await readJson<RegisterInput>(req);
  const data = registerSchema.parse(body);
  const role = ROLE_MAP[data.role];

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ApiError(409, "An account with that email already exists.", "email_taken", {
      fieldErrors: { email: "An account with that email already exists." },
    });
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role,
        phone: data.phone || null,
        city: data.city,
        state: data.state,
        zip: data.zip,
        notificationPrefs: { create: {} },
        documents: undefined,
      },
    });

    await tx.userRole.create({ data: { userId: created.id, role } });

    if (role === "FAMILY") {
      await tx.familyProfile.create({
        data: {
          userId: created.id,
          city: data.city,
          state: data.state,
          zip: data.zip,
          childrenCount: 0,
          careNeeds: listToCsv([]),
          onboardingComplete: false,
        },
      });
    }

    if (role === "CAREGIVER") {
      const slug = await uniqueCaregiverSlug(`${data.firstName} ${data.lastName}`);
      await tx.caregiverProfile.create({
        data: {
          userId: created.id,
          slug,
          city: data.city,
          state: data.state,
          zip: data.zip,
          isPublished: false,
        },
      });
    }

    if (role === "AGENCY") {
      const slug = await uniqueAgencySlug(data.agencyName || `${data.firstName} Agency`);
      await tx.agencyProfile.create({
        data: {
          userId: created.id,
          slug,
          name: data.agencyName || `${data.firstName} ${data.lastName} Agency`,
          contactEmail: data.email,
          contactPhone: data.phone || null,
          city: data.city,
          state: data.state,
          zip: data.zip,
          status: "PENDING",
        },
      });
    }

    return created;
  });

  // Verification email (development transport logs instead of sending).
  const token = await issueToken(user.id, "EMAIL_VERIFY", 60 * 24);
  const template = await renderTemplate(
    "VERIFY_EMAIL",
    {
      firstName: user.firstName,
      token,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    },
    {
      subject: "Confirm your CareNest email address",
      title: "Confirm your email address",
      body: `<p style="margin:0 0 16px;color:#374151;line-height:1.6">Hi {{firstName}}, please confirm your email address to unlock messaging, applications and job posting.</p>
      <p style="margin:0 0 16px"><a href="{{appUrl}}/verify-email/{{token}}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Verify my email</a></p>`,
    }
  );
  await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    templateKey: "VERIFY_EMAIL",
  });

  await notify({
    userId: user.id,
    type: "WELCOME",
    title: "Welcome to CareNest",
    body: "Complete your profile to get the most out of the marketplace.",
    link: ROLE_HOME[role],
  });

  await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") });

  return jsonOk({
    id: user.id,
    role,
    redirectTo: ROLE_HOME[role],
    emailVerificationRequired: true,
  });
});
