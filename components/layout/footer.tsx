import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { prisma } from "@/lib/prisma";
import { careLandingPath } from "@/lib/category-routes";

const CARE_LINKS = [
  { href: "/find-nannies", label: "Find a nanny" },
  { href: "/find-babysitters", label: "Find a babysitter" },
  { href: "/find-childcare", label: "Find childcare" },
  { href: "/find-senior-care", label: "Find senior care" },
  { href: "/find-pet-care", label: "Find pet care" },
  { href: "/find-housekeeping", label: "Find housekeeping" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const SUPPORT_LINKS = [
  { href: "/help", label: "Help center" },
  { href: "/safety", label: "Safety & trust" },
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
];

export async function SiteFooter() {
  const [pages, categories] = await Promise.all([
    prisma.cMSPage
      .findMany({
        where: { status: "PUBLISHED", showInFooter: true },
        select: { slug: true, title: true },
        orderBy: { title: "asc" },
        take: 6,
      })
      .catch(() => []),
    prisma.careCategory
      .findMany({
        where: { isActive: true, isCareType: true },
        orderBy: { sortOrder: "asc" },
        select: { slug: true, name: true },
      })
      .catch(() => []),
  ]);

  return (
    <footer className="mt-20 border-t border-border bg-sand-50">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-ink-500">
              A marketplace for families and caregivers to find each other, build trust and
              arrange reliable care.
            </p>
            <p className="mt-4 max-w-xs text-xs leading-5 text-muted-foreground">
              CareNest is a platform that connects people. We do not employ caregivers, and we
              cannot guarantee any caregiver&apos;s safety. Always interview, check references and
              follow our safety guidance.
            </p>
          </div>

          <FooterColumn
            title="Find care"
            links={
              categories.length
                ? categories.map((c) => ({ href: careLandingPath(c.slug), label: c.name }))
                : CARE_LINKS
            }
          />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn
            title="Support"
            links={[...SUPPORT_LINKS, ...pages.map((p) => ({ href: `/${p.slug}`, label: p.title }))]}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} CareNest. All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-4">
            <Link href="/care-jobs" className="hover:text-primary">
              Care jobs
            </Link>
            <Link href="/locations" className="hover:text-primary">
              Locations
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-900">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link href={link.href} className="text-sm text-ink-500 transition-colors hover:text-primary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
