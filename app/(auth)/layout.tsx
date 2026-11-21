import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline hover:text-primary">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(246,217,184,0.28),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-center px-12 xl:px-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
            CareNest marketplace
          </p>
          <h2 className="display mt-4 max-w-md text-4xl leading-[1.15] text-white">
            Find trusted care. Build meaningful connections.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-white/80">
            Thousands of families and caregivers use CareNest to compare profiles, arrange
            interviews and agree on care — with verification and reviews that reflect real checks.
          </p>

          <div className="mt-10 space-y-5">
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Verification trails you can read"
              body="Identity, background and qualification checks are shown separately and only after review."
            />
            <Feature
              icon={<Users className="h-5 w-5" />}
              title="Built for both sides"
              body="Families post jobs and shortlist; caregivers apply, interview and build a reviewed reputation."
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 max-w-sm text-[13px] leading-6 text-white/70">{body}</p>
      </div>
    </div>
  );
}
