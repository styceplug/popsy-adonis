"use client";

import { useMemo, useState } from "react";
import { formatNaira } from "@/lib/format-money";

type AdminTicketTier = {
  id: string;
  name: string;
  priceKobo: number;
  capacity: number;
  soldCount: number;
  event: {
    title: string;
  };
};

type AdminTicketPromo = {
  id: string;
  ticketTierId: string;
  name: string;
  promoPriceKobo: number;
  startsAt: string;
  endsAt: string | null;
  quantityLimit: number;
  maxPerBuyer: number;
  isActive: boolean;
};

type PromoFormState = {
  id: string;
  ticketTierId: string;
  name: string;
  promoPriceNaira: string;
  startsAt: string;
  endsAt: string;
  quantityLimit: string;
  maxPerBuyer: string;
  isActive: boolean;
};

function toLocalDateTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function emptyPromoForm(ticketTierId = ""): PromoFormState {
  return {
    id: "",
    ticketTierId,
    name: "",
    promoPriceNaira: "",
    startsAt: "",
    endsAt: "",
    quantityLimit: "20",
    maxPerBuyer: "1",
    isActive: true,
  };
}

export function PromoAdminPanel({
  tiers,
  promos,
}: {
  tiers: AdminTicketTier[];
  promos: AdminTicketPromo[];
}) {
  const [promoList, setPromoList] = useState(promos);
  const [tierPrices, setTierPrices] = useState(
    Object.fromEntries(tiers.map((tier) => [tier.id, String(tier.priceKobo / 100)])),
  );
  const [promoForm, setPromoForm] = useState<PromoFormState>(() => emptyPromoForm(tiers[0]?.id));
  const [status, setStatus] = useState("");
  const selectedTier = useMemo(
    () => tiers.find((tier) => tier.id === promoForm.ticketTierId),
    [promoForm.ticketTierId, tiers],
  );

  async function updateTierPrice(tierId: string) {
    setStatus("Saving ticket price...");
    const response = await fetch("/api/admin/ticket-tiers/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketTierId: tierId,
        priceNaira: Number(tierPrices[tierId]),
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(payload?.message ?? "Unable to update ticket price.");
      return;
    }

    setStatus("Ticket price updated. Refresh to see the new base price everywhere.");
  }

  function editPromo(promo: AdminTicketPromo) {
    setPromoForm({
      id: promo.id,
      ticketTierId: promo.ticketTierId,
      name: promo.name,
      promoPriceNaira: String(promo.promoPriceKobo / 100),
      startsAt: toLocalDateTimeInput(promo.startsAt),
      endsAt: toLocalDateTimeInput(promo.endsAt),
      quantityLimit: String(promo.quantityLimit),
      maxPerBuyer: String(promo.maxPerBuyer),
      isActive: promo.isActive,
    });
    setStatus("");
  }

  async function savePromo() {
    setStatus("Saving promo...");
    const response = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: promoForm.id || undefined,
        ticketTierId: promoForm.ticketTierId,
        name: promoForm.name,
        promoPriceNaira: Number(promoForm.promoPriceNaira),
        startsAt: promoForm.startsAt ? new Date(promoForm.startsAt).toISOString() : "",
        endsAt: promoForm.endsAt ? new Date(promoForm.endsAt).toISOString() : null,
        quantityLimit: Number(promoForm.quantityLimit),
        maxPerBuyer: Number(promoForm.maxPerBuyer),
        isActive: promoForm.isActive,
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(payload?.message ?? "Unable to save promo.");
      return;
    }

    setStatus("Promo saved. Refresh to see the latest list.");
    if (!promoForm.id) setPromoForm(emptyPromoForm(promoForm.ticketTierId));
  }

  async function togglePromo(promo: AdminTicketPromo) {
    const nextIsActive = !promo.isActive;
    setStatus(nextIsActive ? "Resuming promo..." : "Pausing promo...");
    const response = await fetch(`/api/admin/promos/${promo.id}/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextIsActive }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(payload?.message ?? "Unable to update promo status.");
      return;
    }

    setPromoList((current) =>
      current.map((item) => (item.id === promo.id ? { ...item, isActive: nextIsActive } : item)),
    );
    setPromoForm((current) =>
      current.id === promo.id ? { ...current, isActive: nextIsActive } : current,
    );
    setStatus(nextIsActive ? "Promo resumed." : "Promo paused.");
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <p className="text-xs font-black uppercase text-gold">Ticket prices</p>
        <div className="mt-4 grid gap-3">
          {tiers.map((tier) => (
            <div key={tier.id} className="grid gap-3 rounded-ui border border-white/10 p-4 md:grid-cols-[1fr_160px_auto] md:items-center">
              <div>
                <p className="font-display text-xl font-black">{tier.event.title} - {tier.name}</p>
                <p className="mt-1 text-xs text-paper/48">
                  Current {formatNaira(tier.priceKobo)} / Sold {tier.soldCount} of {tier.capacity}
                </p>
              </div>
              <input
                value={tierPrices[tier.id] ?? ""}
                onChange={(event) => setTierPrices((current) => ({ ...current, [tier.id]: event.target.value }))}
                className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
                type="number"
                min={0}
                step={100}
              />
              <button
                onClick={() => updateTierPrice(tier.id)}
                className="focus-ring h-11 rounded-ui bg-gold px-4 text-sm font-black text-ink hover:bg-paper"
              >
                Save price
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <div>
          <p className="text-xs font-black uppercase text-gold">Promo</p>
          <h3 className="mt-2 font-display text-3xl font-black">{promoForm.id ? "Edit promo" : "Create promo"}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Ticket tier
            <select
              value={promoForm.ticketTierId}
              onChange={(event) => setPromoForm((current) => ({ ...current, ticketTierId: event.target.value }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
            >
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.event.title} - {tier.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Promo name
            <input
              value={promoForm.name}
              onChange={(event) => setPromoForm((current) => ({ ...current, name: event.target.value }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
              placeholder="10:30PM Half Price"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Promo price
            <input
              value={promoForm.promoPriceNaira}
              onChange={(event) => setPromoForm((current) => ({ ...current, promoPriceNaira: event.target.value }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
              type="number"
              min={0}
              step={100}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Starts
            <input
              value={promoForm.startsAt}
              onChange={(event) => setPromoForm((current) => ({ ...current, startsAt: event.target.value }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
              type="datetime-local"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Ends optional, defaults same day
            <input
              value={promoForm.endsAt}
              onChange={(event) => setPromoForm((current) => ({ ...current, endsAt: event.target.value }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
              type="datetime-local"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Promo slots
            <input
              value={promoForm.quantityLimit}
              onChange={(event) => setPromoForm((current) => ({ ...current, quantityLimit: event.target.value }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
              type="number"
              min={1}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Max per buyer
            <input
              value={promoForm.maxPerBuyer}
              onChange={(event) => setPromoForm((current) => ({ ...current, maxPerBuyer: event.target.value }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
              type="number"
              min={1}
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-paper/72">
            <input
              checked={promoForm.isActive}
              onChange={(event) => setPromoForm((current) => ({ ...current, isActive: event.target.checked }))}
              type="checkbox"
              className="size-4 accent-gold"
            />
            Promo active
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={savePromo}
            className="focus-ring h-11 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper"
          >
            Save promo
          </button>
          <button
            onClick={() => setPromoForm(emptyPromoForm(selectedTier?.id ?? tiers[0]?.id))}
            className="focus-ring h-11 rounded-ui border border-white/12 px-5 text-sm font-bold text-paper/72 hover:border-paper hover:text-paper"
          >
            New promo
          </button>
          {status ? <p className="text-sm font-bold text-paper/60">{status}</p> : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-ui border border-white/10">
        <div className="grid grid-cols-[1fr_.8fr_.7fr_.6fr_.6fr_auto] gap-4 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-paper/45">
          <p>Promo</p>
          <p>Tier</p>
          <p>Price</p>
          <p>Slots</p>
          <p>Status</p>
          <p>Actions</p>
        </div>
        <div className="divide-y divide-white/10">
          {promoList.map((promo) => {
            const promoTier = tiers.find((tier) => tier.id === promo.ticketTierId);
            return (
              <div
                key={promo.id}
                className="grid grid-cols-[1fr_.8fr_.7fr_.6fr_.6fr_auto] gap-4 px-4 py-4 text-sm"
              >
                <span>
                  <span className="block font-black text-paper">{promo.name}</span>
                  <span className="mt-1 block text-xs text-paper/45">
                    {new Date(promo.startsAt).toLocaleString()}
                    {promo.endsAt ? ` - ${new Date(promo.endsAt).toLocaleString()}` : ""}
                  </span>
                </span>
                <span className="font-bold text-paper/72">{promoTier?.name ?? "Unknown tier"}</span>
                <span className="font-black text-gold">{formatNaira(promo.promoPriceKobo)}</span>
                <span className="text-paper/62">{promo.quantityLimit} / max {promo.maxPerBuyer}</span>
                <span className={promo.isActive ? "font-black text-gold" : "font-black text-paper/45"}>
                  {promo.isActive ? "Active" : "Disabled"}
                </span>
                <span className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => editPromo(promo)}
                    className="focus-ring h-9 rounded-ui border border-white/12 px-3 text-xs font-black text-paper/72 hover:border-paper hover:text-paper"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => togglePromo(promo)}
                    className={`focus-ring h-9 rounded-ui px-3 text-xs font-black ${
                      promo.isActive
                        ? "border border-lava/45 text-lava hover:bg-lava/10"
                        : "border border-gold/45 text-gold hover:bg-gold/10"
                    }`}
                  >
                    {promo.isActive ? "Pause" : "Resume"}
                  </button>
                </span>
              </div>
            );
          })}
          {promoList.length === 0 ? <p className="px-4 py-6 text-sm text-paper/50">No promos yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
