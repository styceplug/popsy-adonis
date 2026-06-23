import { posts } from "@/lib/sample-data";
import { PostCard } from "@/components/trends/post-card";

export function TrendRail() {
  return (
    <section className="bg-ink py-20">
      <div className="section-shell">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase text-gold">Trends & Promotions</p>
            <h2 className="mt-3 font-display text-4xl font-black text-paper md:text-6xl">Culture feed</h2>
          </div>
          <p className="hidden max-w-sm text-sm leading-6 text-paper/55 md:block">
            Editorial cards are built for video, audio embeds, release notes, and high-impact image stories.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} large={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

