import { handler, jsonOk, assertSameOrigin } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { saveUpload, type UploadKind } from "@/lib/storage";
import { ApiError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";

const KINDS: UploadKind[] = [
  "AVATAR", "CERTIFICATE", "ID_DOCUMENT", "BACKGROUND_REPORT",
  "JOB_ATTACHMENT", "MESSAGE_ATTACHMENT", "AGENCY_LICENSE",
];

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await enforceRateLimit(`uploads:${user.id}`, 30, 3600, "Too many uploads. Please try again later.");

  const form = await req.formData().catch(() => null);
  if (!form) throw ApiError.badRequest("Expected a multipart form upload.");

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  if (!(file instanceof File)) throw ApiError.badRequest("Choose a file to upload.");
  if (!KINDS.includes(kind as UploadKind)) throw ApiError.badRequest("Unknown upload type.");

  const isPublic = kind === "AVATAR" || kind === "JOB_ATTACHMENT";
  const document = await saveUpload({ file, userId: user.id, kind: kind as UploadKind, isPublic });

  return jsonOk(
    {
      id: document.id,
      url: document.url ?? `/api/files/${document.id}`,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
    },
    { status: 201 }
  );
});
