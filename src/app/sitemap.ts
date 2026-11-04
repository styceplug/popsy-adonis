import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { artists, events, posts } from "@/lib/sample-data";

const SITE_URL = "https://popsyadonis.com";
const LAST_MODIFIED = new Date("2026-06-24T00:00:00.000Z");

// Products come from the database, so build the sitemap on request rather than once at build time.
export const dynamic = "force-dynamic";

function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/artists"), lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.85 },
    { url: absoluteUrl("/events"), lastModified: LAST_MODIFIED, changeFrequency: "daily", priority: 0.95 },
    { url: absoluteUrl("/events/archive"), lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/trends"), lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.85 },
    { url: absoluteUrl("/paflux"), lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 0.75 },
    { url: absoluteUrl("/contact"), lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
  ];

  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: absoluteUrl(`/events/${event.slug}`),
    lastModified: LAST_MODIFIED,
    changeFrequency: event.status === "upcoming" ? "daily" : "monthly",
    priority: event.status === "upcoming" ? 0.95 : 0.7,
    images: [absoluteUrl(event.heroImage)],
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/trends/${post.slug}`),
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: 0.72,
    images: [absoluteUrl(post.coverImage)],
  }));

  const artistRoutes: MetadataRoute.Sitemap = artists.map((artist) => ({
    url: absoluteUrl(`/artists/${artist.slug}`),
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: artist.name === "Popsy Adonis" ? 0.82 : 0.68,
    images: [absoluteUrl(artist.image)],
  }));

  // Only pieces on sale right now; a database hiccup leaves them out rather than breaking the sitemap.
  const products = await prisma.product
    .findMany({
      where: { status: "ACTIVE", variants: { some: {} } },
      select: { slug: true, images: true, updatedAt: true },
    })
    .catch(() => []);

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/paflux/${product.slug}`),
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.65,
    images: product.images.map(absoluteUrl),
  }));

  return [...staticRoutes, ...eventRoutes, ...postRoutes, ...artistRoutes, ...productRoutes];
}
