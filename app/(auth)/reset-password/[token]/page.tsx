import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";
import { peekToken } from "@/lib/tokens";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Choose a new password",
  description: "Set a new password for your CareNest account.",
  path: "/reset-password",
  noIndex: true,
});

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await peekToken(token, "PASSWORD_RESET");

  if (!valid) {
    return (
      <div>
        <h1 className="display text-3xl">This link has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Password reset links are single-use and expire after one hour. Request a new one to
          continue.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display text-3xl">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        For security, signing in on other devices will be required again.
      </p>
      <div className="mt-8">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
