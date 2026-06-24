"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { brand } from "@/lib/sample-data";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Artists", href: "/artists" },
  { label: "Events", href: "/events" },
  { label: "Contact us", href: "/contact" },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header data-site-header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="section-shell flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl font-black uppercase text-paper" onClick={() => setIsOpen(false)}>
          {brand.siteName}
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-paper/68 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-paper">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/merch"
          className="focus-ring hidden h-10 items-center gap-2 rounded-ui bg-paper px-4 text-sm font-black text-ink transition hover:bg-gold md:inline-flex"
          onClick={() => setIsOpen(false)}
        >
          <ShoppingBag size={16} />
          {brand.merchName}
        </Link>

        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-ui border border-white/12 text-paper transition hover:border-gold hover:text-gold md:hidden"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-white/10 bg-ink/96 md:hidden">
          <nav className="section-shell grid gap-1 py-4 text-base font-black text-paper">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-ui px-1 py-3 text-paper/76 transition hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/merch"
              onClick={() => setIsOpen(false)}
              className="focus-ring mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-ui bg-paper px-5 text-sm font-black text-ink transition hover:bg-gold"
            >
              <ShoppingBag size={16} />
              {brand.merchName}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
