import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { consumeToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/rbac";
import { notify } from "@/lib/notifications";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Verify your email",
  description: "Confirm your CareNest email address.",
  path: "/verify-email",
  noIndex: true,
});

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const consumed = await consumeToken(token, "EMAIL_VERIFY");
  const user = await getSessionUser();

  let verified = false;
  if (consumed) {
    const account = await prisma.user.findFirst({
      where: { id: consumed.userId, emailVerifiedAt: null },
      select: { id: true, firstName: true },
    });
    if (account) {
      await prisma.user.update({
        where: { id: account.id },
        data: { emailVerifiedAt: new Date() },
      });
      await notify({
        userId: account.id,
        type: "EMAIL_VERIFIED",
        title: "Email verified",
        body: "Your email address is confirmed. You now have full access to CareNest.",
      });
      verified = true;
    } else {
      // Already verified with this token's owner.
      verified = true;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-soft">
        {verified ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="display text-2xl">Email verified</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Thanks{user ? `, ${user.firstName}` : ""} — your email address is confirmed. Messaging,
              applications and job posting are now unlocked.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link href={user ? ROLE_HOME[user.role] : "/login"}>
                {user ? "Go to your dashboard" : "Sign in"}
              </Link>
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <XCircle className="h-7 w-7" />
            </div>
            <h1 className="display text-2xl">Link expired or invalid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Verification links are single-use and expire after 24 hours. Sign in and request a new
              one from your dashboard.
            </p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link href={user ? "/dashboard" : "/login"}>Continue</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
