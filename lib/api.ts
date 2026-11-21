import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/errors";
import { isPrismaUniqueError } from "@/lib/json";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code, details: error.details },
      { status: error.status }
    );
  }
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Please correct the highlighted fields.",
        code: "validation_error",
        details: { fieldErrors },
      },
      { status: 422 }
    );
  }
  if (isPrismaUniqueError(error)) {
    return NextResponse.json(
      { ok: false, error: "A record with those details already exists.", code: "conflict" },
      { status: 409 }
    );
  }
  console.error("[api] unhandled error", error);
  return NextResponse.json(
    { ok: false, error: "Something went wrong. Please try again.", code: "server_error" },
    { status: 500 }
  );
}

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

/** Wrap a route handler with consistent error serialization. */
export function handler(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      return jsonError(error);
    }
  };
}

/** Best-effort client IP for rate limiting and audit records. */
export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * CSRF protection for state-changing requests. Browsers always send Origin on
 * cross-site POSTs; a mismatch (or missing Origin with a Sec-Fetch-Site of
 * cross-site) is rejected. Session cookies are also SameSite=Lax.
 */
export function assertSameOrigin(req: Request) {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return;

  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if (site === "cross-site") throw ApiError.forbidden("Cross-site request blocked.");

  if (!origin) return; // non-browser clients (documented API usage)
  const host = req.headers.get("host");
  try {
    const originHost = new URL(origin).host;
    if (host && originHost !== host) {
      throw ApiError.forbidden("Cross-origin request blocked.");
    }
  } catch {
    throw ApiError.forbidden("Invalid origin header.");
  }
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw ApiError.badRequest("Request body must be valid JSON.");
  }
}
