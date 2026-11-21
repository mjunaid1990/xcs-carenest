import { handler } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { canAccessDocument, readStoredFile } from "@/lib/storage";
import { ApiError } from "@/lib/errors";

export const runtime = "nodejs";

/** Authorised file delivery. Private documents never get a public URL. */
export const GET = handler(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const document = await canAccessDocument(id!, user.id, user.role === "ADMIN");
  if (!document) throw ApiError.notFound("File not found.");

  if (document.url) {
    return Response.redirect(document.url, 302);
  }

  const buffer = await readStoredFile(document.storageKey);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `inline; filename="${document.fileName.replace(/["\r\n]/g, "")}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
