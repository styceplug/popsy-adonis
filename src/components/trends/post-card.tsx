import Link from "next/link";
import { Headphones, Play, Newspaper } from "lucide-react";
import type { Post } from "@/lib/sample-data";

const icons = {
  video: Play,
  audio: Headphones,
  editorial: Newspaper,
};

export function PostCard({ post, large = false }: { post: Post; large?: boolean }) {
  const Icon = icons[post.mediaType];

  return (
    <Link
      href={`/trends/${post.slug}`}
      className={`group grid overflow-hidden rounded-ui border border-white/10 bg-white/[0.035] transition hover:border-gold/70 ${
        large ? "md:row-span-2" : ""
      }`}
    >
      <div
        className={`bg-cover bg-center ${large ? "aspect-[4/3] md:aspect-auto md:min-h-[360px]" : "aspect-[4/3]"}`}
        style={{ backgroundImage: `url(${post.coverImage})` }}
      />
      <div className="grid content-between gap-5 p-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-ui border border-white/10 bg-ink px-3 py-2 text-xs font-bold text-paper">
            <Icon size={14} />
            {post.type}
          </div>
          <p className="mt-5 text-xs font-bold uppercase text-gold">{post.category}</p>
          <h3 className="mt-2 font-display text-2xl font-black leading-tight text-paper group-hover:text-gold">
            {post.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-paper/62">{post.excerpt}</p>
        </div>
        <p className="text-sm font-black text-paper/70 transition group-hover:text-gold">Read story</p>
      </div>
    </Link>
  );
}
