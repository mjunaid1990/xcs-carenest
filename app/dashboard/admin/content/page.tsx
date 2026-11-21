import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { ContentEditor } from "./content-editor";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireRole("ADMIN");
  const [pages, posts] = await Promise.all([
    prisma.cMSPage.findMany({ orderBy: { slug: "asc" } }),
    prisma.blogPost.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);

  return (
    <div>
      <PageHeader title="Content" description="Edit CMS pages and blog posts. Markdown is rendered safely; publishing updates SEO metadata on the public site." />

      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold">CMS pages</h2>
        <div className="space-y-2">
          {pages.map((page) => (
            <article key={page.id} className="rounded-2xl border border-border/70 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{page.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /{page.slug} · updated {formatDate(page.updatedAt)}
                    {page.showInFooter ? " · in footer" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={page.status === "PUBLISHED" ? "success" : "muted"}>{page.status.toLowerCase()}</Badge>
                  <ContentEditor
                    resource="cms"
                    id={page.id}
                    fields={[
                      { name: "slug", label: "Slug", value: page.slug },
                      { name: "title", label: "Title", value: page.title },
                      { name: "subtitle", label: "Subtitle", value: page.subtitle },
                      { name: "content", label: "Content (Markdown)", kind: "textarea", value: page.content },
                      { name: "status", label: "Status (DRAFT or PUBLISHED)", value: page.status },
                      { name: "seoTitle", label: "SEO title", value: page.seoTitle },
                      { name: "seoDescription", label: "SEO description", kind: "textarea", value: page.seoDescription },
                      { name: "showInFooter", label: "Show in footer", kind: "checkbox", value: page.showInFooter },
                    ]}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Blog posts</h2>
        {posts.length ? (
          <div className="space-y-2">
            {posts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-border/70 bg-white p-4 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <Link href={`/blog/${post.slug}`} className="hover:text-primary">/blog/{post.slug}</Link> ·{" "}
                      {post.authorName} · {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={post.status === "PUBLISHED" ? "success" : "muted"}>{post.status.toLowerCase()}</Badge>
                    <ContentEditor
                      resource="blog"
                      id={post.id}
                      fields={[
                        { name: "slug", label: "Slug", value: post.slug },
                        { name: "title", label: "Title", value: post.title },
                        { name: "excerpt", label: "Excerpt", kind: "textarea", value: post.excerpt },
                        { name: "content", label: "Content (Markdown)", kind: "textarea", value: post.content },
                        { name: "category", label: "Category", value: post.category },
                        { name: "authorName", label: "Author name", value: post.authorName },
                        { name: "coverImageUrl", label: "Cover image URL", value: post.coverImageUrl },
                        { name: "status", label: "Status (DRAFT, PUBLISHED or ARCHIVED)", value: post.status },
                        { name: "seoTitle", label: "SEO title", value: post.seoTitle },
                        { name: "seoDescription", label: "SEO description", kind: "textarea", value: post.seoDescription },
                      ]}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No blog posts yet.</p>
        )}
      </section>
    </div>
  );
}
