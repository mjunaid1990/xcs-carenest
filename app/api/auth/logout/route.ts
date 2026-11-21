import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ ok: false, error: "Cross-site request blocked." }, { status: 403 });
  }
  await destroySession();

  // HTML form submissions are redirected; API clients get JSON.
  const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");
  if (wantsHtml) {
    return NextResponse.redirect(new URL("/", req.url), { status: 303 });
  }
  return NextResponse.json({ ok: true, data: { signedOut: true } });
}

export async function GET(req: Request) {
  return POST(req);
}
