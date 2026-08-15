"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  Mail,
  Package,
  PackageCheck,
  PenLine,
  ScrollText,
  Ticket,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Ticket;
  hint: string;
};

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, hint: "Sales snapshot and shortcuts" },
    ],
  },
  {
    label: "At the gate",
    items: [
      { label: "Check in", href: "/admin/checkin", icon: ClipboardCheck, hint: "Scan tickets at the door" },
      { label: "Tickets", href: "/admin/tickets", icon: Ticket, hint: "Find or resend a ticket" },
      { label: "Issue a ticket", href: "/admin/tickets/issue", icon: PenLine, hint: "For cash or transfer payments" },
      { label: "Water guns", href: "/admin/water-guns", icon: PackageCheck, hint: "Hand over paid add-ons" },
    ],
  },
  {
    label: "Selling",
    items: [
      { label: "Events", href: "/admin/events", icon: CalendarDays, hint: "Events, tickets, and prices" },
      { label: "Promos", href: "/admin/promos", icon: BadgePercent, hint: "Limited-time ticket deals" },
      { label: "PA FLUX store", href: "/admin/merch", icon: Package, hint: "Merch, stock, and orders" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Subscribers", href: "/admin/subscribers", icon: Mail, hint: "Email the waitlist" },
      { label: "Activity log", href: "/admin/logs", icon: ScrollText, hint: "Who did what, and when" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  // When two entries both match (/admin/tickets and /admin/tickets/issue), only the
  // most specific one should light up.
  const activeHref = navGroups
    .flatMap((group) => group.items)
    .filter((item) => (item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  function isActive(href: string) {
    return href === activeHref;
  }

  return (
    <div>
      <nav className="flex gap-2 overflow-x-auto pb-2 lg:hidden" aria-label="Admin sections">
        {navGroups
          .flatMap((group) => group.items)
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`focus-ring inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "border-gold bg-gold text-ink"
                    : "border-white/12 text-paper/68 hover:border-paper hover:text-paper"
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <nav
        className="hidden h-fit rounded-ui border border-white/10 bg-white/[0.035] p-3 lg:sticky lg:top-6 lg:block"
        aria-label="Admin sections"
      >
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wide text-paper/38">
              {group.label}
            </p>
            <div className="grid gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`focus-ring rounded-ui px-3 py-2.5 transition ${
                      active ? "bg-gold/12 text-gold" : "text-paper/68 hover:bg-white/[0.055] hover:text-gold"
                    }`}
                  >
                    <span className="inline-flex items-center gap-3 text-sm font-bold">
                      <Icon size={17} />
                      {item.label}
                    </span>
                    <span className={`mt-0.5 block pl-8 text-xs leading-4 ${active ? "text-gold/70" : "text-paper/38"}`}>
                      {item.hint}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="inline-flex items-start gap-2 px-3 text-xs leading-5 text-paper/42">
            <ListChecks className="mt-0.5 shrink-0" size={14} />
            Every admin action is stored with staff name and time.
          </p>
        </div>
      </nav>
    </div>
  );
}
