import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

async function loadPost(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();
  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
    image: post.coverImageUrl ?? undefined,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const related = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED", id: { not: post.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { slug: true, title: true, excerpt: true },
  });

  return (
    <article className="container-page py-10 sm:py-14">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>

      <header className="mx-auto mt-6 max-w-3xl">
        {post.category ? <Badge variant="secondary">{post.category}</Badge> : null}
        <h1 className="display mt-3 text-3xl leading-tight sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-[15px] leading-7 text-ink-500">{post.excerpt}</p>
        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {post.authorName}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.publishedAt ?? post.createdAt)}</span>
        </p>
      </header>

      {post.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImageUrl} alt="" className="mx-auto mt-8 max-w-4xl rounded-3xl object-cover" />
      ) : null}

      <div
        className="prose-care mx-auto mt-10 max-w-3xl"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />

      {related.length ? (
        <aside className="mx-auto mt-14 max-w-4xl border-t border-border pt-8">
          <h2 className="text-lg font-semibold">Keep reading</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-2xl border border-border/70 bg-white p-4 hover:border-primary/40">
                <p className="text-sm font-semibold leading-snug">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.excerpt}</p>
              </Link>
            ))}
          </div>
        </aside>
      ) : null}
    </article>
  );
}
