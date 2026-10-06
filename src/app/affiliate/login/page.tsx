import { redirect } from "next/navigation";
import { AffiliateAuthForm } from "@/components/affiliate/affiliate-auth-form";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export default async function AffiliateLoginPage() {
  if (await getCurrentAffiliate()) redirect("/affiliate");

  return (
    <section className="section-shell flex min-h-screen items-center justify-center py-16">
      <div className="w-full max-w-md rounded-ui border border-white/10 bg-white/[0.035] p-6">
        <p className="text-xs font-black uppercase text-gold">Popsy Adonis Affiliates</p>
        <h1 className="mt-3 font-display text-4xl font-black">Affiliate login</h1>
        <p className="mt-3 text-sm leading-6 text-paper/60">Log in to copy your ticket links, track your sales, and withdraw your earnings.</p>
        <AffiliateAuthForm mode="login" />
      </div>
    </section>
  );
}
