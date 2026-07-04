"use client";

import { useState } from "react";

type AdminTicketTier = {
  id: string;
  name: string;
  priceKobo: number;
  capacity: number;
  soldCount: number;
  perks: string[];
  isActive: boolean;
};

type AdminEvent = {
  id: string;
  title: string;
  slug: string;
  description: string;
  venue: string;
  city: string;
  startsAt: string;
  status: "DRAFT" | "PUBLISHED" | "SOLD_OUT" | "COMPLETED" | "CANCELLED";
  heroImage: string | null;
  ticketTiers: AdminTicketTier[];
};

type TierFormState = {
  id?: string;
  name: string;
  priceNaira: string;
  capacity: string;
  perksText: string;
  isActive: boolean;
};

type EventFormState = Omit<AdminEvent, "ticketTiers" | "startsAt"> & {
  startsAt: string;
  ticketTiers: TierFormState[];
};

function toLocalDateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function emptyTier(): TierFormState {
  return {
    name: "Regular",
    priceNaira: "5000",
    capacity: "500",
    perksText: "Regular access\nFree swimming",
    isActive: true,
  };
}

function emptyEvent(): EventFormState {
  return {
    id: "",
    title: "",
    slug: "",
    description: "",
    venue: "",
    city: "Ekiti",
    startsAt: "",
    status: "DRAFT",
    heroImage: "",
    ticketTiers: [emptyTier()],
  };
}

function eventToForm(event: AdminEvent): EventFormState {
  return {
    ...event,
    heroImage: event.heroImage ?? "",
    startsAt: toLocalDateTimeInput(event.startsAt),
    ticketTiers: event.ticketTiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      priceNaira: String(tier.priceKobo / 100),
      capacity: String(tier.capacity),
      perksText: tier.perks.join("\n"),
      isActive: tier.isActive,
    })),
  };
}

export function EventAdminPanel({ events }: { events: AdminEvent[] }) {
  const [eventList, setEventList] = useState(events);
  const [form, setForm] = useState<EventFormState>(() => (events[0] ? eventToForm(events[0]) : emptyEvent()));
  const [status, setStatus] = useState("");

  function updateTier(index: number, patch: Partial<TierFormState>) {
    setForm((current) => ({
      ...current,
      ticketTiers: current.ticketTiers.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, ...patch } : tier,
      ),
    }));
  }

  async function saveEvent() {
    setStatus("Saving event...");
    const response = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: form.id || undefined,
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description,
        venue: form.venue,
        city: form.city,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
        status: form.status,
        heroImage: form.heroImage,
        ticketTiers: form.ticketTiers.map((tier) => ({
          id: tier.id,
          name: tier.name,
          priceNaira: Number(tier.priceNaira),
          capacity: Number(tier.capacity),
          perks: tier.perksText.split(/\n+/).map((perk) => perk.trim()).filter(Boolean),
          isActive: tier.isActive,
        })),
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(payload?.message ?? "Unable to save event.");
      return;
    }

    setStatus("Event saved. Refresh to see public pages update.");
    setEventList((current) =>
      current.some((event) => event.id === payload.event.id)
        ? current.map((event) => (event.id === payload.event.id ? { ...event, ...payload.event } : event))
        : [payload.event, ...current],
    );
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-gold">Events editor</p>
            <h3 className="mt-2 font-display text-3xl font-black">{form.id ? "Edit event" : "Create event"}</h3>
          </div>
          <button
            onClick={() => {
              setForm(emptyEvent());
              setStatus("");
            }}
            className="focus-ring h-10 rounded-ui border border-white/12 px-4 text-sm font-bold text-paper/72 hover:border-paper hover:text-paper"
          >
            New event
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Title
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Slug
            <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72 md:col-span-2">
            Description
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-32 rounded-ui border border-white/10 bg-ink p-3 text-sm leading-6 text-paper" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Venue
            <input value={form.venue} onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))} className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            City
            <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Starts
            <input value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} type="datetime-local" className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Status
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as EventFormState["status"] }))} className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SOLD_OUT">Sold out</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72 md:col-span-2">
            Hero image
            <input value={form.heroImage ?? ""} onChange={(event) => setForm((current) => ({ ...current, heroImage: event.target.value }))} className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" placeholder="/POPSY%20ADONIS%20FLUX%20PARTY.jpeg" />
            {form.heroImage ? (
              <span
                className="block min-h-48 rounded-ui border border-white/10 bg-cover bg-center"
                style={{ backgroundImage: `url(${form.heroImage})` }}
              />
            ) : null}
          </label>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase text-gold">Ticket tiers</p>
            <button onClick={() => setForm((current) => ({ ...current, ticketTiers: [...current.ticketTiers, emptyTier()] }))} className="focus-ring h-9 rounded-ui border border-white/12 px-3 text-xs font-black text-paper/72 hover:border-paper hover:text-paper">
              Add tier
            </button>
          </div>
          {form.ticketTiers.map((tier, index) => (
            <div key={tier.id ?? index} className="grid gap-3 rounded-ui border border-white/10 p-3 md:grid-cols-[1fr_.65fr_.65fr_.8fr_auto]">
              <input value={tier.name} onChange={(event) => updateTier(index, { name: event.target.value })} className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" placeholder="Regular" />
              <input value={tier.priceNaira} onChange={(event) => updateTier(index, { priceNaira: event.target.value })} className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" type="number" min={0} placeholder="Price" />
              <input value={tier.capacity} onChange={(event) => updateTier(index, { capacity: event.target.value })} className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" type="number" min={1} placeholder="Capacity" />
              <textarea value={tier.perksText} onChange={(event) => updateTier(index, { perksText: event.target.value })} className="min-h-10 rounded-ui border border-white/10 bg-ink p-2 text-xs leading-5 text-paper" placeholder="One perk per line" />
              <label className="flex items-center gap-2 text-xs font-bold text-paper/60">
                <input type="checkbox" checked={tier.isActive} onChange={(event) => updateTier(index, { isActive: event.target.checked })} className="size-4 accent-gold" />
                Active
              </label>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={saveEvent} className="focus-ring h-11 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper">
            Save event
          </button>
          {status ? <p className="text-sm font-bold text-paper/60">{status}</p> : null}
        </div>
      </section>

      <section className="grid gap-3">
        {eventList.map((event) => (
          <button
            key={event.id}
            onClick={() => {
              setForm(eventToForm(event));
              setStatus("");
            }}
            className="focus-ring rounded-ui border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-gold/50"
          >
            <span className="flex flex-wrap items-start justify-between gap-3">
              <span>
                <span className="block font-display text-2xl font-black text-paper">{event.title}</span>
                <span className="mt-1 block text-xs text-paper/45">{event.slug}</span>
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-gold">{event.status}</span>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
