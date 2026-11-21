import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { verificationRequestSchema } from "@/lib/validators";
import { stringifyJson } from "@/lib/json";
import { notify } from "@/lib/notifications";

export const GET = handler(async () => {
  const user = await requireUser();
  const requests = await prisma.verificationRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, type: true, status: true, provider: true,
      reviewNote: true, decidedAt: true, createdAt: true,
    },
  });
  return jsonOk(requests);
});

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const input = verificationRequestSchema.parse(await readJson(req));

  if (input.documentId) {
    const doc = await prisma.uploadedDocument.findFirst({
      where: { id: input.documentId, userId: user.id },
      select: { id: true },
    });
    if (!doc) throw ApiError.badRequest("Upload the document before submitting a verification request.");
  }

  const pending = await prisma.verificationRequest.findFirst({
    where: { userId: user.id, type: input.type, status: { in: ["PENDING", "INFO_REQUESTED"] } },
  });
  if (pending) throw ApiError.conflict("You already have a pending request for this check.");

  const request = await prisma.verificationRequest.create({
    data: {
      userId: user.id,
      type: input.type,
      documentId: input.documentId || null,
      submittedData: stringifyJson({ fullLegalName: input.fullLegalName, notes: input.notes }),
      status: "PENDING",
    },
    select: { id: true, type: true, status: true },
  });

  if (user.role === "CAREGIVER") {
    await prisma.caregiverProfile.updateMany({
      where: { userId: user.id, verificationStatus: "UNVERIFIED" },
      data: { verificationStatus: "PENDING" },
    });
  }

  await notify({
    userId: user.id,
    type: "VERIFICATION",
    title: "Verification request received",
    body: "Our trust and safety team will review your documents. We will let you know when there is an update.",
    link: "/dashboard/verification",
  });

  return jsonOk(request, { status: 201 });
});
