import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminSession } from "@/lib/admin-auth";

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
        <div className="grid gap-6 py-6 lg:grid-cols-[250px_1fr]">
          <AdminNav />
          <section>{children}</section>
        </div>
      </div>
    </main>
  );
}
