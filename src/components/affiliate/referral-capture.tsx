"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Picks up ?ref=CODE from an affiliate link and hands it to the server once per visit. */
export function ReferralCapture() {
  const pathname = usePathname();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (!code) return;

    const eventSlug = pathname.match(/^\/events\/([^/]+)/)?.[1];
    const seenKey = `popsy-ref-seen:${code}:${eventSlug ?? ""}`;

    try {
      if (window.sessionStorage.getItem(seenKey)) return;
      window.sessionStorage.setItem(seenKey, "1");
    } catch {
      // Storage blocked: still track, at worst a refresh counts as another click.
    }

    fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, eventSlug }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
