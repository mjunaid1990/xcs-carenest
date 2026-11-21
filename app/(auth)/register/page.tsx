import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";
import { getSessionUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Create your account",
  description:
    "Join CareNest as a family, caregiver or agency. Build a profile, search caregivers or apply for care jobs.",
  path: "/register",
});

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role]);

  const { role } = await searchParams;
  const initialRole =
    role === "caregiver" || role === "agency" ? role : role === "family" ? "family" : undefined;

  return (
    <div>
      <h1 className="display text-3xl">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        It takes about a minute. You can add the rest of your profile afterwards.
      </p>

      <div className="mt-8">
        <RegisterForm initialRole={initialRole} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
