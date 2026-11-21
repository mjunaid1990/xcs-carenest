import { ForgotPasswordForm } from "./forgot-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Reset your password",
  description: "Request a password reset link for your CareNest account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="display text-3xl">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the email address on your account and we will send a link to choose a new password.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
