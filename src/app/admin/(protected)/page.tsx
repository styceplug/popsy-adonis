import Link from "next/link";
import { ClipboardCheck, ScrollText, Ticket } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin | Popsy Adonis",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const auditLogDelegate = (prisma as unknown as {
    adminAuditLog?: {
      count: () => Promise<number>;
    };
  }).adminAuditLog;
  const [ticketCount, checkedInCount, logCount] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { checkedInAt: { not: null } } }),
    auditLogDelegate?.count().catch(() => 0) ?? Promise.resolve(0),
  ]);

  const stats = [
    { label: "Tickets issued", value: ticketCount },
    { label: "Checked in", value: checkedInCount },
    { label: "Audit logs", value: logCount },
  ];

  const actions = [
    { label: "Open scanner", href: "/admin/checkin", icon: ClipboardCheck },
    { label: "View tickets", href: "/admin/tickets", icon: Ticket },
    { label: "View logs", href: "/admin/logs", icon: ScrollText },
  ];

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Overview</p>
      <h2 className="mt-2 font-display text-5xl font-black">Admin dashboard</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
            <p className="font-display text-4xl font-black">{stat.value}</p>
            <p className="mt-2 text-xs font-black uppercase text-paper/45">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-ui border border-white/10 bg-white/[0.035] p-5 transition hover:border-gold"
            >
              <Icon className="text-gold" size={24} />
              <p className="mt-5 font-display text-2xl font-black group-hover:text-gold">{action.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
