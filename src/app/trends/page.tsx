import type { Metadata } from "next";
import { PostCard } from "@/components/trends/post-card";
import { posts } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Trends & Promotions | Popsy Adonis",
  description:
    "Read Popsy Adonis culture updates, event announcements, music releases, promotional drops, and EKSU entertainment stories.",
  alternates: {
    canonical: "/trends",
  },
};

export default function TrendsPage() {
  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell pb-20">
        <p className="text-xs font-black uppercase text-gold">CMS-ready publishing</p>
        <h1 className="display-title mt-4 max-w-4xl text-6xl md:text-8xl">Trends & Promotions</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/64">
          Articles, trend updates, music releases, embedded audio, video recaps, and promotional drops in one editorial engine.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} large={index === 0} />
          ))}
        </div>
      </section>
    </main>
  );
}
