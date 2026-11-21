import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accountSettingsSchema, notificationPrefsSchema } from "@/lib/validators";

export const PATCH = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const body = await readJson<Record<string, unknown>>(req);

  if (body.kind === "notifications") {
    const prefs = notificationPrefsSchema.parse(body);
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...prefs },
      update: prefs,
    });
    return jsonOk({ updated: true });
  }

  const input = accountSettingsSchema.parse(body);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || null,
      timezone: input.timezone,
      city: input.city || null,
      state: input.state || null,
      zip: input.zip || null,
    },
  });
  return jsonOk({ updated: true });
});
