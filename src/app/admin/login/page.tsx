import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = {
  title: "Admin Login | Popsy Adonis",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
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
      <section className="section-shell flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-ui border border-white/10 bg-white/[0.035] p-6">
          <p className="text-xs font-black uppercase text-gold">Popsy Adonis Admin</p>
          <h1 className="mt-3 font-display text-4xl font-black">Staff access</h1>
          <p className="mt-3 text-sm leading-6 text-paper/60">
            Enter your name and the central admin password. Your name will be attached to all admin actions.
          </p>
          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}
