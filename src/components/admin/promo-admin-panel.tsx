"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type Feedback = { tone: "success" | "error"; message: string };

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

const inputStyles = "h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper";

export function PromoAdminPanel({
  tiers,
  promos,
}: {
  tiers: AdminTicketTier[];
  promos: AdminTicketPromo[];
}) {
  const router = useRouter();
  const [tierList, setTierList] = useState(tiers);
  const [promoList, setPromoList] = useState(promos);
  const [tierPrices, setTierPrices] = useState(
    Object.fromEntries(tiers.map((tier) => [tier.id, String(tier.priceKobo / 100)])),
  );
  const [tierCapacities, setTierCapacities] = useState(
    Object.fromEntries(tiers.map((tier) => [tier.id, String(tier.capacity)])),
  );
  const [promoForm, setPromoForm] = useState<PromoFormState>(() => emptyPromoForm(tiers[0]?.id));
  const [pricingFeedback, setPricingFeedback] = useState<Feedback | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<Feedback | null>(null);
  const selectedTier = useMemo(
    () => tierList.find((tier) => tier.id === promoForm.ticketTierId),
    [promoForm.ticketTierId, tierList],
  );

  async function updateTierPrice(tierId: string) {
    setPricingFeedback(null);
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
      setPricingFeedback({ tone: "error", message: payload?.message ?? "Unable to update the ticket price." });
      return;
    }

    setPricingFeedback({ tone: "success", message: "Price updated. Fans now see the new price." });
    router.refresh();
  }

  async function updateTierCapacity(tierId: string) {
    setPricingFeedback(null);
    const response = await fetch("/api/admin/ticket-tiers/capacity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketTierId: tierId,
        capacity: Number(tierCapacities[tierId]),
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setPricingFeedback({ tone: "error", message: payload?.message ?? "Unable to update ticket availability." });
      return;
    }

    setTierList((current) =>
      current.map((tier) => (tier.id === tierId ? { ...tier, capacity: payload.tier.capacity } : tier)),
    );
    setPricingFeedback({ tone: "success", message: "Availability updated." });
    router.refresh();
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
    setPromoFeedback(null);
    window.scrollTo({ top: 0 });
  }

  async function savePromo() {
    setPromoFeedback(null);
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
      setPromoFeedback({ tone: "error", message: payload?.message ?? "Unable to save the promo. Check the fields and try again." });
      return;
    }

    setPromoFeedback({ tone: "success", message: promoForm.id ? "Promo updated." : "Promo created." });
    if (!promoForm.id) setPromoForm(emptyPromoForm(promoForm.ticketTierId));
    router.refresh();
  }

  async function togglePromo(promo: AdminTicketPromo) {
    const nextIsActive = !promo.isActive;
    setPromoFeedback(null);
    const response = await fetch(`/api/admin/promos/${promo.id}/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextIsActive }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setPromoFeedback({ tone: "error", message: payload?.message ?? "Unable to update the promo." });
      return;
    }

    setPromoList((current) =>
      current.map((item) => (item.id === promo.id ? { ...item, isActive: nextIsActive } : item)),
    );
    setPromoForm((current) =>
      current.id === promo.id ? { ...current, isActive: nextIsActive } : current,
    );
    setPromoFeedback({ tone: "success", message: nextIsActive ? "Promo is running again." : "Promo paused. Fans see the normal price." });
    router.refresh();
  }

  async function deletePromo(promo: AdminTicketPromo) {
    const confirmed = window.confirm(`Delete "${promo.name}"? This removes it from the active promo list.`);

    if (!confirmed) return;

    setPromoFeedback(null);
    const response = await fetch(`/api/admin/promos/${promo.id}`, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setPromoFeedback({ tone: "error", message: payload?.message ?? "Unable to delete the promo." });
      return;
    }

    setPromoList((current) => current.filter((item) => item.id !== promo.id));
    setPromoForm((current) =>
      current.id === promo.id ? emptyPromoForm(selectedTier?.id ?? tiers[0]?.id) : current,
    );
    setPromoFeedback({ tone: "success", message: "Promo deleted." });
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <p className="text-xs font-black uppercase text-gold">Ticket prices &amp; availability</p>
        <p className="mt-1 text-xs leading-5 text-paper/42">
          Quick edits to tickets that are on sale right now. Changes apply immediately. For perks, names, or new tiers, use the Events page.
        </p>

        {pricingFeedback ? (
          <p
            className={`mt-4 rounded-ui border p-3 text-sm font-bold ${
              pricingFeedback.tone === "success" ? "border-gold/35 bg-gold/10 text-gold" : "border-lava/40 bg-lava/10 text-lava"
            }`}
          >
            {pricingFeedback.message}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3">
          {tierList.map((tier) => (
            <div key={tier.id} className="rounded-ui border border-white/10 p-4">
              <div>
                <p className="font-display text-xl font-black">{tier.event.title} - {tier.name}</p>
                <p className="mt-1 text-xs text-paper/48">
                  Selling at {formatNaira(tier.priceKobo)} · {tier.soldCount} of {tier.capacity} sold
                </p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[160px_auto_160px_auto] md:items-end">
                <label className="grid gap-1.5 text-xs font-black uppercase text-paper/45">
                  Price (naira)
                  <input
                    value={tierPrices[tier.id] ?? ""}
                    onChange={(event) => setTierPrices((current) => ({ ...current, [tier.id]: event.target.value }))}
                    className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm font-normal normal-case text-paper"
                    type="number"
                    min={0}
                    step={100}
                  />
                </label>
                <button
                  onClick={() => updateTierPrice(tier.id)}
                  className="focus-ring h-11 rounded-ui bg-gold px-4 text-sm font-black text-ink hover:bg-paper"
                >
                  Save price
                </button>
                <label className="grid gap-1.5 text-xs font-black uppercase text-paper/45">
                  Tickets available
                  <input
                    value={tierCapacities[tier.id] ?? ""}
                    onChange={(event) => setTierCapacities((current) => ({ ...current, [tier.id]: event.target.value }))}
                    className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm font-normal normal-case text-paper"
                    type="number"
                    min={tier.soldCount}
                    step={1}
                  />
                </label>
                <button
                  onClick={() => updateTierCapacity(tier.id)}
                  className="focus-ring h-11 rounded-ui border border-gold/45 px-4 text-sm font-black text-gold hover:bg-gold/10"
                >
                  Save availability
                </button>
              </div>
            </div>
          ))}
          {tierList.length === 0 ? (
            <p className="rounded-ui border border-white/10 p-4 text-sm text-paper/50">
              No tickets are on sale. Publish an event with active tiers first.
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-5 rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <div>
          <p className="text-xs font-black uppercase text-gold">Promos</p>
          <h3 className="mt-2 font-display text-3xl font-black">{promoForm.id ? "Edit promo" : "Create a promo"}</h3>
          <p className="mt-2 text-xs leading-5 text-paper/42">
            A promo temporarily drops the price of one ticket tier for a limited number of tickets, between a start and end time.
          </p>
        </div>

        {promoFeedback ? (
          <p
            className={`rounded-ui border p-3 text-sm font-bold ${
              promoFeedback.tone === "success" ? "border-gold/35 bg-gold/10 text-gold" : "border-lava/40 bg-lava/10 text-lava"
            }`}
          >
            {promoFeedback.message}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Ticket tier
            <select
              value={promoForm.ticketTierId}
              onChange={(event) => setPromoForm((current) => ({ ...current, ticketTierId: event.target.value }))}
              className={inputStyles}
            >
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.event.title} - {tier.name} ({formatNaira(tier.priceKobo)})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Promo name
            <input
              value={promoForm.name}
              onChange={(event) => setPromoForm((current) => ({ ...current, name: event.target.value }))}
              className={inputStyles}
              placeholder="10:30PM Half Price"
            />
            <span className="text-xs font-normal leading-5 text-paper/42">Fans see this name next to the discounted price.</span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Promo price (naira)
            <input
              value={promoForm.promoPriceNaira}
              onChange={(event) => setPromoForm((current) => ({ ...current, promoPriceNaira: event.target.value }))}
              className={inputStyles}
              type="number"
              min={0}
              step={100}
            />
            {selectedTier ? (
              <span className="text-xs font-normal leading-5 text-paper/42">
                Normal price is {formatNaira(selectedTier.priceKobo)}.
              </span>
            ) : null}
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Promo tickets
            <input
              value={promoForm.quantityLimit}
              onChange={(event) => setPromoForm((current) => ({ ...current, quantityLimit: event.target.value }))}
              className={inputStyles}
              type="number"
              min={1}
            />
            <span className="text-xs font-normal leading-5 text-paper/42">How many tickets can be sold at the promo price.</span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Starts
            <input
              value={promoForm.startsAt}
              onChange={(event) => setPromoForm((current) => ({ ...current, startsAt: event.target.value }))}
              className={inputStyles}
              type="datetime-local"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Ends
            <input
              value={promoForm.endsAt}
              onChange={(event) => setPromoForm((current) => ({ ...current, endsAt: event.target.value }))}
              className={inputStyles}
              type="datetime-local"
            />
            <span className="text-xs font-normal leading-5 text-paper/42">Optional. If empty, the promo ends the same day it starts.</span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Max per buyer
            <input
              value={promoForm.maxPerBuyer}
              onChange={(event) => setPromoForm((current) => ({ ...current, maxPerBuyer: event.target.value }))}
              className={inputStyles}
              type="number"
              min={1}
            />
            <span className="text-xs font-normal leading-5 text-paper/42">How many promo tickets one person can buy.</span>
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-paper/72">
            <input
              checked={promoForm.isActive}
              onChange={(event) => setPromoForm((current) => ({ ...current, isActive: event.target.checked }))}
              type="checkbox"
              className="size-4 accent-gold"
            />
            Promo is on
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={savePromo}
            className="focus-ring h-11 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper"
          >
            {promoForm.id ? "Save changes" : "Create promo"}
          </button>
          {promoForm.id ? (
            <button
              onClick={() => {
                setPromoForm(emptyPromoForm(selectedTier?.id ?? tiers[0]?.id));
                setPromoFeedback(null);
              }}
              className="focus-ring h-11 rounded-ui border border-white/12 px-5 text-sm font-bold text-paper/72 hover:border-paper hover:text-paper"
            >
              Cancel editing
            </button>
          ) : null}
        </div>
      </section>

      <section className="overflow-x-auto rounded-ui border border-white/10">
        <div className="min-w-190">
          <div className="grid grid-cols-[1fr_.8fr_.7fr_.6fr_.6fr_auto] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase text-paper/45">
            <p>Promo</p>
            <p>Tier</p>
            <p>Price</p>
            <p>Tickets</p>
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
                  <span className="font-bold text-paper/72">
                    {promoTier ? `${promoTier.event.title} - ${promoTier.name}` : "Unknown tier"}
                  </span>
                  <span className="font-black text-gold">{formatNaira(promo.promoPriceKobo)}</span>
                  <span className="text-paper/62">{promo.quantityLimit} / max {promo.maxPerBuyer} each</span>
                  <span className={promo.isActive ? "font-black text-gold" : "font-black text-paper/45"}>
                    {promo.isActive ? "On" : "Paused"}
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
                    <button
                      onClick={() => deletePromo(promo)}
                      className="focus-ring h-9 rounded-ui border border-lava/45 px-3 text-xs font-black text-lava hover:bg-lava/10"
                    >
                      Delete
                    </button>
                  </span>
                </div>
              );
            })}
            {promoList.length === 0 ? <p className="px-4 py-6 text-sm text-paper/50">No promos yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
