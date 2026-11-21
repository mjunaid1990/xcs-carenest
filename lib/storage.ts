import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

/**
 * File storage abstraction.
 *
 * - `local` (default): files are written under ./storage/uploads and served
 *   through an authorised route; private documents are never publicly reachable.
 * - `cloudinary`: signed uploads to Cloudinary when credentials are configured.
 *
 * Both drivers create an UploadedDocument row that records ownership so access
 * control can be enforced on read.
 */

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ROOT = path.join(process.cwd(), "storage", "uploads");

export type UploadKind =
  | "AVATAR"
  | "CERTIFICATE"
  | "ID_DOCUMENT"
  | "BACKGROUND_REPORT"
  | "JOB_ATTACHMENT"
  | "MESSAGE_ATTACHMENT"
  | "AGENCY_LICENSE";

export async function saveUpload(opts: {
  file: File;
  userId: string;
  kind: UploadKind;
  isPublic?: boolean;
}) {
  const { file, userId, kind } = opts;
  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 8);
  const isImage = kind === "AVATAR";
  const allowed = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;

  if (!allowed.includes(file.type)) {
    throw ApiError.badRequest(
      `Unsupported file type. Allowed: ${allowed.map((t) => t.split("/")[1]).join(", ")}.`
    );
  }
  if (file.size > maxMb * 1024 * 1024) {
    throw ApiError.badRequest(`File is too large. Maximum size is ${maxMb}MB.`);
  }
  if (file.size === 0) throw ApiError.badRequest("The file is empty.");

  // Never trust the client filename: derive a safe name from a random id.
  const ext = safeExtension(file.name, file.type);
  const key = `${userId}/${kind.toLowerCase()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

  let url: string | null = null;
  const driver = (process.env.UPLOAD_DRIVER ?? "local").toLowerCase();

  if (driver === "cloudinary" && process.env.CLOUDINARY_CLOUD_NAME) {
    url = await uploadToCloudinary(file, key);
  } else {
    const destination = path.join(ROOT, key);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(destination, buffer);
    url = null; // served through /api/files/[id]
  }

  return prisma.uploadedDocument.create({
    data: {
      userId,
      kind,
      fileName: sanitizeName(file.name),
      storageKey: key,
      url,
      mimeType: file.type,
      sizeBytes: file.size,
      isPublic: opts.isPublic ?? false,
    },
  });
}

async function uploadToCloudinary(file: File, publicId: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw ApiError.badRequest(
      "Cloudinary is selected but CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET are missing."
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_FOLDER ?? "carenest";
  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("public_id", publicId);
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[storage] cloudinary error", res.status, text.slice(0, 300));
    throw new ApiError(502, "Upload failed while contacting object storage.");
  }
  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) throw new ApiError(502, "Object storage returned no URL.");
  return json.secure_url;
}

/** Stream a stored file after the caller has authorised access. */
export async function readStoredFile(storageKey: string) {
  const normalized = path
    .normalize(storageKey)
    .replace(/^(\.\.(\/|\\|$))+/, "")
    .replace(/\\/g, "/");
  const full = path.join(ROOT, normalized);
  if (!full.startsWith(ROOT)) throw ApiError.forbidden("Invalid file path.");
  try {
    return await fs.readFile(full);
  } catch {
    throw ApiError.notFound("File not found in storage.");
  }
}

function safeExtension(name: string, mime: string) {
  const fromName = name.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
  };
  return map[mime] ?? "bin";
}

function sanitizeName(name: string) {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 160);
}

/**
 * Authorisation for document reads: owner, platform admin, or a party to the
 * conversation/job the file was attached to. Documents marked private are never
 * served to anyone else.
 */
export async function canAccessDocument(documentId: string, userId: string, isAdmin: boolean) {
  const doc = await prisma.uploadedDocument.findUnique({ where: { id: documentId } });
  if (!doc) return null;
  if (doc.userId === userId || isAdmin) return doc;
  if (doc.kind === "MESSAGE_ATTACHMENT") {
    const message = await prisma.message.findFirst({
      where: {
        attachmentUrl: doc.id,
        conversation: { participants: { some: { userId } } },
      },
      select: { id: true },
    });
    if (message) return doc;
  }
  return null;
}
