import { handler, jsonOk, assertSameOrigin, readJson, clientIp } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { stringifyJson } from "@/lib/json";
import {
  blogPostSchema,
  categorySchema,
  cmsPageSchema,
  locationSchema,
  planSchema,
  settingsSchema,
} from "@/lib/validators";

type Resource = "plans" | "categories" | "locations" | "cms" | "blog" | "settings";

const schemas = {
  plans: planSchema,
  categories: categorySchema,
  locations: locationSchema,
  cms: cmsPageSchema,
  blog: blogPostSchema,
} as const;

function prepare(resource: Resource, input: Record<string, unknown>) {
  if (resource === "plans") {
    return { ...input, features: stringifyJson(input.features ?? []) };
  }
  if (resource === "settings") return input;
  return input;
}

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const admin = await requireRole("ADMIN");
  const body = await readJson<{ resource: Resource; data: Record<string, unknown> }>(req);
  const { resource } = body;
  if (!["plans", "categories", "locations", "cms", "blog"].includes(resource)) {
    throw ApiError.badRequest("Unknown content resource.");
  }

  const schema = (schemas as Record<string, { parse: (value: unknown) => Record<string, unknown> }>)[resource];
  const parsed = schema.parse(body.data ?? {});
  const data = prepare(resource, parsed);

  const model = (prisma as unknown as Record<string, { create: (args: unknown) => Promise<{ id: string }> }>)[
    resource === "plans" ? "subscriptionPlan"
      : resource === "categories" ? "careCategory"
      : resource === "locations" ? "location"
      : resource === "cms" ? "cMSPage"
      : "blogPost"
  ];

  const created = await model.create({
    data: resource === "blog"
      ? { ...data, publishedAt: (data as { status?: string }).status === "PUBLISHED" ? new Date() : null }
      : data,
  });

  await audit({
    actorId: admin.id,
    action: `admin.${resource}.create`,
    entityType: resource,
    entityId: created.id,
    ip: clientIp(req),
  });
  return jsonOk(created, { status: 201 });
});

export const PATCH = handler(async (req) => {
  assertSameOrigin(req);
  const admin = await requireRole("ADMIN");
  const body = await readJson<{ resource: Resource; id?: string; data: Record<string, unknown> }>(req);

  if (body.resource === "settings") {
    const { values } = settingsSchema.parse(body.data ?? {});
    await prisma.$transaction(
      Object.entries(values).map(([key, value]) =>
        prisma.platformSetting.upsert({
          where: { key },
          create: { key, value, group: "general" },
          update: { value },
        })
      )
    );
    await audit({ actorId: admin.id, action: "admin.settings.update", entityType: "PlatformSetting", ip: clientIp(req) });
    return jsonOk({ updated: Object.keys(values).length });
  }

  if (!body.id) throw ApiError.badRequest("Missing record id.");
  const schema = (schemas as Record<string, { parse: (value: unknown) => Record<string, unknown> }>)[body.resource];
  if (!schema) throw ApiError.badRequest("Unknown content resource.");
  const data = prepare(body.resource, schema.parse(body.data ?? {}));

  const model = (prisma as unknown as Record<string, { update: (args: unknown) => Promise<{ id: string }> }>)[
    body.resource === "plans" ? "subscriptionPlan"
      : body.resource === "categories" ? "careCategory"
      : body.resource === "locations" ? "location"
      : body.resource === "cms" ? "cMSPage"
      : "blogPost"
  ];

  const updated = await model.update({
    where: { id: body.id },
    data: body.resource === "blog"
      ? { ...data, publishedAt: (data as { status?: string }).status === "PUBLISHED" ? new Date() : null }
      : data,
  });

  await audit({
    actorId: admin.id,
    action: `admin.${body.resource}.update`,
    entityType: body.resource,
    entityId: body.id,
    ip: clientIp(req),
  });
  return jsonOk(updated);
});

export const DELETE = handler(async (req) => {
  assertSameOrigin(req);
  const admin = await requireRole("ADMIN");
  const body = await readJson<{ resource: Resource; id: string }>(req);

  const model = (prisma as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>)[
    body.resource === "plans" ? "subscriptionPlan"
      : body.resource === "categories" ? "careCategory"
      : body.resource === "locations" ? "location"
      : body.resource === "cms" ? "cMSPage"
      : "blogPost"
  ];
  if (!model) throw ApiError.badRequest("Unknown content resource.");

  // Soft-disable content so historical references keep working.
  await model.update({
    where: { id: body.id },
    data: body.resource === "blog" ? { status: "ARCHIVED" } : { isActive: false },
  });
  await audit({ actorId: admin.id, action: `admin.${body.resource}.archive`, entityType: body.resource, entityId: body.id, ip: clientIp(req) });
  return jsonOk({ archived: true });
});
