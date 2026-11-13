import { ArrowUpRight } from "lucide-react";

type StreamingLinks = { appleMusic?: string; audiomack?: string };

/** "Apple Music" and "Audiomack" buttons for a song or artist; missing links are left out. */
export function StreamingButtons({
  links,
  title,
  size = "sm",
}: {
  links: StreamingLinks;
  /** Used in the accessible label, e.g. the song title. */
  title?: string;
  size?: "sm" | "md";
}) {
  const buttons = [
    { label: "Apple Music", href: links.appleMusic, className: "bg-[#fa2d48] text-paper hover:bg-paper hover:text-ink" },
    { label: "Audiomack", href: links.audiomack, className: "bg-[#ffa200] text-ink hover:bg-paper" },
  ].filter((button): button is { label: string; href: string; className: string } => Boolean(button.href));

  if (buttons.length === 0) return null;

  const sizing = size === "md" ? "h-11 px-5 text-sm" : "h-9 px-3.5 text-xs";

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((button) => (
        <a
          key={button.label}
          href={button.href}
          target="_blank"
          rel="noreferrer"
          aria-label={title ? `Stream ${title} on ${button.label}` : `Listen on ${button.label}`}
          className={`focus-ring inline-flex items-center gap-1.5 rounded-ui font-black transition ${sizing} ${button.className}`}
        >
          {button.label}
          <ArrowUpRight size={size === "md" ? 16 : 14} />
        </a>
      ))}
    </div>
  );
}
