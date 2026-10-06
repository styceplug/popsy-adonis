"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard API needs HTTPS. Fall back to selecting the text in a temporary field.
      const field = document.createElement("textarea");
      field.value = link;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="focus-ring inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-ui bg-gold px-4 text-xs font-black text-ink transition hover:bg-paper"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
