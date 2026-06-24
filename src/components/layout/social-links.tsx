import Link from "next/link";
import type { ComponentProps } from "react";

type SocialLink = {
  label: string;
  href: string;
};

const iconPaths: Record<string, ComponentProps<"path">["d"][]> = {
  Instagram: [
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z",
    "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z",
    "M17.5 6.5h.01",
  ],
  TikTok: [
    "M14 3v10.2a4.8 4.8 0 1 1-4.8-4.8",
    "M14 3c.7 3.3 2.7 5.2 6 5.6",
  ],
  X: ["M4 4l16 16", "M20 4 4 20"],
  Telegram: ["M21 4 3 11l7 3 3 6 3-5 5-11Z", "m10 14 10-10"],
  Facebook: ["M15 8h3V4h-3a5 5 0 0 0-5 5v3H7v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1Z"],
};

function SocialIcon({ label }: { label: string }) {
  const paths = iconPaths[label] ?? iconPaths.X;

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

export function SocialLinks({ socials, compact = false }: { socials: SocialLink[]; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {socials.map((social) => (
        <Link
          key={social.label}
          href={social.href}
          className={`focus-ring inline-flex items-center justify-center gap-2 rounded-ui border border-white/12 text-paper/70 transition hover:border-gold hover:text-gold ${
            compact ? "size-10" : "h-10 px-3 text-xs font-black uppercase"
          }`}
          target="_blank"
          rel="noreferrer"
          aria-label={social.label}
          title={social.label}
        >
          <SocialIcon label={social.label} />
          {compact ? null : social.label}
        </Link>
      ))}
    </div>
  );
}
