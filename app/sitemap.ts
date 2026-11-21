import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { careLandingPath } from "@/lib/category-routes";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  // Never fail a build that runs without a reachable database (e.g. a fresh CI/Vercel build):
  // fall back to the static routes and let the revalidation fill in the rest.
  const [categories, caregivers, jobs, posts, pages, locations] = await Promise.all([
    prisma.careCategory.findMany({ where: { isActive: true, isCareType: true }, select: { slug: true, updatedAt: true } }),
    prisma.caregiverProfile.findMany({ where: { isPublished: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.careJob.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.cMSPage.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.location.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]).catch(() => [[], [], [], [], [], []] as const);

  const staticPaths = ["/", "/search", "/care-jobs", "/pricing", "/blog", "/locations", "/contact", "/nanny-jobs", "/babysitting-jobs"];

  return [
    ...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: path === "/" ? 1 : 0.8 })),
    ...categories.map((c) => ({ url: `${base}${careLandingPath(c.slug)}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...caregivers.map((c) => ({ url: `${base}/caregivers/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...jobs.map((j) => ({ url: `${base}/care-jobs/${j.slug}`, lastModified: j.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...pages.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 })),
    ...locations.map((l) => ({ url: `${base}/locations/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
