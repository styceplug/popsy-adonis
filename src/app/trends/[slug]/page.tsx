import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StreamingButtons } from "@/components/music/streaming-buttons";
import { brand, posts, songs } from "@/lib/sample-data";

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
      siteName: "Popsy Adonis",
      locale: "en_NG",
      url: `${SITE_URL}/trends/${post.slug}`,
      title,
      description: post.excerpt,
      images: [{ url: imageUrl, alt: post.title }],
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
        {post.showStreamingLinks ? (
          <div className="mx-auto mt-12 max-w-3xl rounded-ui border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-gold">Stream the songs</p>
                <h2 className="mt-2 font-display text-3xl font-black">Listen now</h2>
              </div>
              <StreamingButtons links={brand.streaming} size="md" />
            </div>
            <div className="mt-6 grid gap-3">
              {songs.map((song) => (
                <div
                  key={song.title}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-ui border border-white/10 p-4"
                >
                  <div>
                    <p className="font-display text-xl font-black">{song.title}</p>
                    <p className="mt-1 text-sm text-paper/58">{song.artists}</p>
                  </div>
                  <StreamingButtons links={song} title={song.title} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </main>
  );
}
