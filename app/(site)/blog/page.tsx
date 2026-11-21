import Link from "next/link";
import { CalendarDays, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "CareNest blog",
  description:
    "Practical guides for families and caregivers: hiring, pay, first weeks, safety and building a lasting care relationship.",
  path: "/blog",
});

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  const [lead, ...rest] = posts;

  return (
    <>
      <section className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-12 sm:py-16">
          <p className="eyebrow">Blog</p>
          <h1 className="display mt-2 text-4xl leading-tight sm:text-5xl">Guidance for better care</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-500">
            Written by our team for the people doing the hiring and the people doing the caring.
          </p>
        </div>
      </section>

      <div className="container-page py-12">
        {!posts.length ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No published articles yet.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-soft">
              {lead!.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lead!.coverImageUrl} alt="" className="h-64 w-full object-cover" />
              ) : (
                <div className="h-3 w-full bg-primary" />
              )}
              <div className="p-6 sm:p-8">
                {lead!.category ? <Badge variant="secondary">{lead!.category}</Badge> : null}
                <h2 className="display mt-3 text-2xl leading-snug sm:text-3xl">
                  <Link href={`/blog/${lead!.slug}`} className="hover:text-primary">{lead!.title}</Link>
                </h2>
                <p className="mt-3 text-sm leading-7 text-ink-500">{lead!.excerpt}</p>
                <PostMeta author={lead!.authorName} date={lead!.publishedAt ?? lead!.createdAt} />
              </div>
            </article>

            <div className="space-y-4">
              {rest.map((post) => (
                <article key={post.id} className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
                  {post.category ? <Badge variant="secondary">{post.category}</Badge> : null}
                  <h3 className="mt-2 text-base font-semibold leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link>
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-ink-500">{post.excerpt}</p>
                  <PostMeta author={post.authorName} date={post.publishedAt ?? post.createdAt} />
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function PostMeta({ author, date }: { author: string; date: Date }) {
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {author}</span>
      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(date)}</span>
    </p>
  );
}
