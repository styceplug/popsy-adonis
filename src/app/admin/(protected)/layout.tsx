import Link from "next/link";
import { BadgePercent, ClipboardCheck, LayoutDashboard, ListChecks, Mail, PackageCheck, ScrollText, Ticket } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { requireAdminSession } from "@/lib/admin-auth";

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Check in", href: "/admin/checkin", icon: ClipboardCheck },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket },
  { label: "Water Guns", href: "/admin/water-guns", icon: PackageCheck },
  { label: "Promo", href: "/admin/promos", icon: BadgePercent },
  { label: "Subscribers", href: "/admin/subscribers", icon: Mail },
  { label: "Logs", href: "/admin/logs", icon: ScrollText },
];

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  return (
    <main className="min-h-screen bg-ink text-paper">
      <style>
        {`
          [data-site-header],
          [data-site-footer],
          [data-cart-link] {
            display: none !important;
          }
        `}
      </style>
      <div className="section-shell py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-black uppercase text-gold">Popsy Adonis Admin</p>
            <h1 className="mt-1 font-display text-3xl font-black">Control room</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="rounded-ui border border-white/10 px-3 py-2 text-sm text-paper/68">
              Staff: <span className="font-black text-paper">{session.name}</span>
            </p>
            <AdminLogoutButton />
          </div>
        </header>
        <div className="grid gap-6 py-6 lg:grid-cols-[220px_1fr]">
          <nav className="h-fit rounded-ui border border-white/10 bg-white/[0.035] p-3 lg:sticky lg:top-6">
            <div className="grid gap-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="focus-ring inline-flex items-center gap-3 rounded-ui px-3 py-3 text-sm font-bold text-paper/68 transition hover:bg-white/[0.055] hover:text-gold"
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="inline-flex items-start gap-2 px-3 text-xs leading-5 text-paper/42">
                <ListChecks className="mt-0.5 shrink-0" size={14} />
                Every admin action is stored with staff name and time.
              </p>
            </div>
          </nav>
          <section>{children}</section>
        </div>
      </div>
    </main>
  );
}
