import { handler, jsonOk, assertSameOrigin, readJson, clientIp } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

type Body = {
  type: "user" | "verification" | "report" | "review" | "job";
  id: string;
  action: string;
  note?: string;
  status?: string;
};

/** Single privileged moderation endpoint with an audit trail for every action. */
export const PATCH = handler(async (req) => {
  assertSameOrigin(req);
  const admin = await requireRole("ADMIN");
  const body = await readJson<Body>(req);
  if (!body.id || !body.type || !body.action) throw ApiError.badRequest("Missing moderation action.");
  const ip = clientIp(req);
  const log = (entityType: string, metadata: Record<string, unknown>) =>
    audit({ actorId: admin.id, action: `admin.${body.type}.${body.action}`, entityType, entityId: body.id, metadata, ip });

  if (body.type === "user") {
    const user = await prisma.user.findUnique({
      where: { id: body.id },
      select: { id: true, role: true, status: true },
    });
    if (!user) throw ApiError.notFound("User not found.");
    if (user.id === admin.id && body.action === "suspend") throw ApiError.badRequest("You cannot suspend your own account.");

    if (body.action === "suspend") {
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { status: "SUSPENDED" } }),
        prisma.session.updateMany({ where: { userId: user.id }, data: { revokedAt: new Date() } }),
      ]);
    } else if (body.action === "reactivate") {
      await prisma.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
    } else {
      throw ApiError.badRequest("Unknown user action.");
    }
    await log("User", { action: body.action });
    return jsonOk({ updated: true });
  }

  if (body.type === "verification") {
    const request = await prisma.verificationRequest.findUnique({ where: { id: body.id } });
    if (!request) throw ApiError.notFound("Verification request not found.");
    if (!["approve", "reject", "info"].includes(body.action)) throw ApiError.badRequest("Unknown verification action.");

    const status = body.action === "approve" ? "APPROVED" : body.action === "reject" ? "REJECTED" : "INFO_REQUESTED";
    await prisma.$transaction(async (tx) => {
      await tx.verificationRequest.update({
        where: { id: request.id },
        data: { status, reviewNote: body.note || null, reviewerId: admin.id, decidedAt: new Date() },
      });

      if (body.action === "approve") {
        const profile = await tx.caregiverProfile.findUnique({ where: { userId: request.userId } });
        if (profile) {
          const data: Record<string, unknown> = {};
          if (request.type === "IDENTITY") data.identityVerifiedAt = new Date();
          if (request.type === "BACKGROUND_CHECK") data.backgroundCheckAt = new Date();
          if (request.type === "QUALIFICATION") data.qualificationsVerifiedAt = new Date();
          if (request.type === "REFERENCE") data.referencesVerifiedAt = new Date();
          if (data.identityVerifiedAt && (profile.backgroundCheckAt || data.backgroundCheckAt)) {
            data.verificationStatus = "VERIFIED";
          }
          await tx.caregiverProfile.update({ where: { id: profile.id }, data });
        }
        if (request.type === "AGENCY_LICENSE") {
          await tx.agencyProfile.updateMany({
            where: { userId: request.userId },
            data: { licenseVerifiedAt: new Date(), status: "VERIFIED" },
          });
        }
      }
      if (body.action === "reject") {
        await tx.caregiverProfile.updateMany({
          where: { userId: request.userId },
          data: { verificationStatus: "REJECTED", verificationNote: body.note || null },
        });
      }
    });

    await notify({
      userId: request.userId,
      type: "VERIFICATION",
      title:
        body.action === "approve" ? "Verification approved"
          : body.action === "reject" ? "Verification declined"
          : "More information needed",
      body: body.note || `Your ${request.type.replace(/_/g, " ").toLowerCase()} review has an update.`,
      link: "/dashboard/verification",
      email: true,
    });
    await log("VerificationRequest", { action: body.action, type: request.type });
    return jsonOk({ status });
  }

  if (body.type === "report") {
    const report = await prisma.report.findUnique({ where: { id: body.id } });
    if (!report) throw ApiError.notFound("Report not found.");
    const status =
      body.action === "resolve" ? "RESOLVED"
        : body.action === "dismiss" ? "DISMISSED"
        : body.action === "review" ? "UNDER_REVIEW"
        : null;
    if (!status) throw ApiError.badRequest("Unknown report action.");

    await prisma.report.update({
      where: { id: report.id },
      data: { status, resolutionNote: body.note || null, handledById: admin.id },
    });
    await notify({
      userId: report.reporterId,
      type: "REPORT_UPDATE",
      title: "Your report has an update",
      body: `A report you submitted is now ${status.toLowerCase().replace("_", " ")}.`,
      link: "/dashboard/notifications",
    });
    await log("Report", { action: body.action, status });
    return jsonOk({ status });
  }

  if (body.type === "review") {
    const review = await prisma.review.findUnique({ where: { id: body.id } });
    if (!review) throw ApiError.notFound("Review not found.");
    const status =
      body.action === "publish" ? "PUBLISHED"
        : body.action === "hide" ? "HIDDEN"
        : body.action === "remove" ? "REMOVED"
        : null;
    if (!status) throw ApiError.badRequest("Unknown review action.");

    await prisma.review.update({
      where: { id: review.id },
      data: { status, moderatedById: admin.id, moderationNote: body.note || null },
    });

    if (review.caregiverId) {
      const aggregate = await prisma.review.aggregate({
        where: { caregiverId: review.caregiverId, status: "PUBLISHED" },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.caregiverProfile.update({
        where: { id: review.caregiverId },
        data: {
          ratingAvg: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
          ratingCount: aggregate._count.rating,
        },
      });
    }
    await log("Review", { action: body.action, status });
    return jsonOk({ status });
  }

  if (body.type === "job") {
    const job = await prisma.careJob.findUnique({ where: { id: body.id }, select: { id: true, status: true } });
    if (!job) throw ApiError.notFound("Job not found.");
    const allowed = ["DRAFT", "PUBLISHED", "PAUSED", "FILLED", "CLOSED", "COMPLETED"];
    if (!body.status || !allowed.includes(body.status)) throw ApiError.badRequest("Unknown job status.");
    await prisma.careJob.update({
      where: { id: job.id },
      data: { status: body.status, publishedAt: body.status === "PUBLISHED" ? new Date() : undefined },
    });
    await log("CareJob", { status: body.status });
    return jsonOk({ status: body.status });
  }

  throw ApiError.badRequest("Unknown moderation type.");
});
