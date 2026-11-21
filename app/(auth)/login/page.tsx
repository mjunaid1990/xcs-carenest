import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getSessionUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/rbac";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Log in",
  description: "Sign in to your CareNest account to manage jobs, applications and messages.",
  path: "/login",
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role]);
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="display text-3xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to continue with your care search or your job applications.
      </p>

      <div className="mt-8">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to CareNest?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
