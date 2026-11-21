import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import { Breadcrumbs } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

/** CMS-driven pages: about, safety, help, terms, privacy, how-it-works. */
export const revalidate = 300;

async function loadPage(slug: string) {
  return prisma.cMSPage.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();
  return buildMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.subtitle || `${page.title} — CareNest`,
    path: `/${page.slug}`,
  });
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, faqs] = await Promise.all([
    loadPage(slug),
    slug === "help"
      ? prisma.faq.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, question: true, answer: true },
        })
      : Promise.resolve([]),
  ]);
  if (!page) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: page.title, path: `/${page.slug}` },
            ])
          ),
        }}
      />
      <div className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-12 sm:py-16">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: `/${page.slug}`, label: page.title }]} />
          <h1 className="display mt-2 max-w-3xl text-4xl leading-tight sm:text-5xl">{page.title}</h1>
          {page.subtitle ? (
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-500">{page.subtitle}</p>
          ) : null}
          <p className="mt-4 text-xs text-muted-foreground">
            Last updated {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(page.updatedAt)}
          </p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article
          className="prose-care max-w-3xl"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
        />
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold">Still need help?</p>
            <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
              Our support team answers questions about accounts, safety and billing.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-border/70 bg-sand-50 p-5">
            <p className="text-sm font-semibold">Explore CareNest</p>
            <ul className="mt-2 space-y-1.5 text-[13px]">
              {[{ href: "/search", label: "Search caregivers" },
                { href: "/care-jobs", label: "Browse care jobs" },
                { href: "/pricing", label: "Compare plans" }].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink-500 hover:text-primary">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {faqs.length ? (
        <div className="container-page pb-16">
          <h2 className="display mb-4 text-2xl">Frequently asked questions</h2>
          <div className="max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border/70 bg-white">
            {faqs.map((faq) => (
              <details key={faq.id} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium">{faq.question}</summary>
                <p className="mt-2 text-sm leading-7 text-ink-500">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
