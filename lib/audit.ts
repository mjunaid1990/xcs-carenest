import { prisma } from "@/lib/prisma";
import { stringifyJson } from "@/lib/json";

/** Append-only admin audit trail. Every privileged mutation calls this. */
export async function audit(opts: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: opts.actorId,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        metadata: opts.metadata ? stringifyJson(opts.metadata) : null,
        ip: opts.ip ?? null,
      },
    });
  } catch (error) {
    // Auditing must never break the primary action, but a failure is logged.
    console.error("[audit] failed to write log", error);
  }
}
