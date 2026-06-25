import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { posts } from "@/lib/sample-data";

const SITE_URL = "https://popsyadonis.com";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return {
      title: "Post Not Found | Popsy Adonis",
    };
  }

  const title = `${post.title} | Popsy Adonis`;
  const imageUrl = `${SITE_URL}${post.coverImage}`;

  return {
    title,
    description: post.excerpt,
    alternates: {
      canonical: `/trends/${post.slug}`,
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/trends/${post.slug}`,
      title,
      description: post.excerpt,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.excerpt,
      images: [imageUrl],
    },
  };
}

export default async function TrendDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);

  if (!post) notFound();

  return (
    <main className="bg-ink pt-28 text-paper">
      <article className="section-shell pb-20">
        <p className="text-xs font-black uppercase text-gold">{post.type}</p>
        <h1 className="display-title mt-4 max-w-5xl text-5xl md:text-8xl">{post.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/66">{post.excerpt}</p>
        <div
          className="mt-10 min-h-[58vh] rounded-ui bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(5,5,5,.1), rgba(5,5,5,.5)), url(${post.coverImage})`,
          }}
        />
        <div className="mx-auto mt-12 max-w-3xl text-lg leading-9 text-paper/72">
          {post.body.map((paragraph) => (
            <p key={paragraph} className="mt-6 first:mt-0">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}
