"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";

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
  soldCount: number;
};

type EventFormState = Omit<AdminEvent, "ticketTiers" | "startsAt"> & {
  startsAt: string;
  ticketTiers: TierFormState[];
};

type Feedback = { tone: "success" | "error"; message: string };

const statusHints: Record<AdminEvent["status"], string> = {
  DRAFT: "Hidden - fans cannot see this event yet.",
  PUBLISHED: "Live - the event is on the site and tickets can be bought.",
  SOLD_OUT: "Shown on the site, but ticket sales are closed.",
  COMPLETED: "Shown as a past event. No ticket sales.",
  CANCELLED: "Hidden from the site. No ticket sales.",
};

const statusChipStyles: Record<AdminEvent["status"], string> = {
  DRAFT: "border-white/15 text-paper/55",
  PUBLISHED: "border-gold/40 bg-gold/10 text-gold",
  SOLD_OUT: "border-lava/40 bg-lava/10 text-lava",
  COMPLETED: "border-white/15 text-paper/55",
  CANCELLED: "border-lava/40 bg-lava/10 text-lava",
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
    name: "",
    priceNaira: "",
    capacity: "500",
    perksText: "",
    isActive: true,
    soldCount: 0,
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
      soldCount: tier.soldCount,
    })),
  };
}

const inputStyles = "h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper";

export function EventAdminPanel({ events }: { events: AdminEvent[] }) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormState | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function openEditor(nextForm: EventFormState) {
    setForm(nextForm);
    setFeedback(null);
    window.scrollTo({ top: 0 });
  }

  function updateTier(index: number, patch: Partial<TierFormState>) {
    setForm((current) =>
      current
        ? {
            ...current,
            ticketTiers: current.ticketTiers.map((tier, tierIndex) =>
              tierIndex === index ? { ...tier, ...patch } : tier,
            ),
          }
        : current,
    );
  }

  async function saveEvent() {
    if (!form || isSaving) return;

    setIsSaving(true);
    setFeedback(null);

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

    setIsSaving(false);

    if (!response.ok) {
      setFeedback({ tone: "error", message: payload?.message ?? "Unable to save event. Check the fields and try again." });
      return;
    }

    setForm((current) => (current ? { ...current, id: payload.event.id } : current));
    setFeedback({ tone: "success", message: "Saved. The public site is updated." });
    router.refresh();
  }

  if (!form) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-paper/55">
            {events.length} event{events.length === 1 ? "" : "s"} · pick one to edit its details, tickets, or prices.
          </p>
          <button
            onClick={() => openEditor(emptyEvent())}
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper"
          >
            <Plus size={16} />
            New event
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {events.map((event) => {
            const activeTiers = event.ticketTiers.filter((tier) => tier.isActive);
            const totalSold = event.ticketTiers.reduce((sum, tier) => sum + tier.soldCount, 0);

            return (
              <button
                key={event.id}
                onClick={() => openEditor(eventToForm(event))}
                className="focus-ring rounded-ui border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-gold/50"
              >
                <span className="flex flex-wrap items-start justify-between gap-3">
                  <span>
                    <span className="block font-display text-2xl font-black text-paper">{event.title}</span>
                    <span className="mt-1 block text-xs text-paper/45">
                      {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(event.startsAt))} ·{" "}
                      {event.venue}, {event.city}
                    </span>
                    <span className="mt-2 block text-xs font-bold text-paper/58">
                      {activeTiers.length > 0
                        ? `${activeTiers.length} tier${activeTiers.length === 1 ? "" : "s"} on sale · ${totalSold} sold`
                        : "No tiers on sale"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${statusChipStyles[event.status]}`}>
                      {event.status.replaceAll("_", " ")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-ui border border-white/12 px-3 py-1.5 text-xs font-black text-paper/72">
                      <Pencil size={13} />
                      Edit
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
          {events.length === 0 ? (
            <p className="rounded-ui border border-white/10 p-5 text-sm text-paper/50">
              No events yet. Create your first event to start selling tickets.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => {
          setForm(null);
          setFeedback(null);
        }}
        className="focus-ring inline-flex h-10 items-center gap-2 rounded-ui border border-white/12 px-4 text-sm font-bold text-paper/72 hover:border-paper hover:text-paper"
      >
        <ArrowLeft size={15} />
        All events
      </button>

      <section className="mt-4 rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <div>
          <p className="text-xs font-black uppercase text-gold">{form.id ? "Editing event" : "New event"}</p>
          <h3 className="mt-2 font-display text-3xl font-black">{form.title || "Untitled event"}</h3>
        </div>

        {feedback ? (
          <p
            className={`mt-4 rounded-ui border p-3 text-sm font-bold ${
              feedback.tone === "success" ? "border-gold/35 bg-gold/10 text-gold" : "border-lava/40 bg-lava/10 text-lava"
            }`}
          >
            {feedback.message}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Title
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, title: event.target.value, slug: current.id ? current.slug : slugify(event.target.value) } : current,
                )
              }
              className={inputStyles}
              placeholder="Summer Finale - After Exam Party"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Link name
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => (current ? { ...current, slug: event.target.value } : current))}
              className={inputStyles}
            />
            <span className="text-xs font-normal leading-5 text-paper/42">
              The public page becomes /events/{form.slug || "your-event"}. Filled in automatically from the title.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72 md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => (current ? { ...current, description: event.target.value } : current))}
              className="min-h-48 rounded-ui border border-white/10 bg-ink p-3 text-sm leading-6 text-paper"
              placeholder="What should fans expect? At least a sentence or two."
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Venue
            <input
              value={form.venue}
              onChange={(event) => setForm((current) => (current ? { ...current, venue: event.target.value } : current))}
              className={inputStyles}
              placeholder="To be announced"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            City
            <input
              value={form.city}
              onChange={(event) => setForm((current) => (current ? { ...current, city: event.target.value } : current))}
              className={inputStyles}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Date & time
            <input
              value={form.startsAt}
              onChange={(event) => setForm((current) => (current ? { ...current, startsAt: event.target.value } : current))}
              type="datetime-local"
              className={inputStyles}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Visibility
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => (current ? { ...current, status: event.target.value as EventFormState["status"] } : current))
              }
              className={inputStyles}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SOLD_OUT">Sold out</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <span className="text-xs font-normal leading-5 text-paper/42">{statusHints[form.status]}</span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72 md:col-span-2">
            Hero image
            <input
              value={form.heroImage ?? ""}
              onChange={(event) => setForm((current) => (current ? { ...current, heroImage: event.target.value } : current))}
              className={inputStyles}
              placeholder="/EVENTS/SummerFinale-main.JPG"
            />
            {form.heroImage ? (
              <span
                className="block min-h-48 rounded-ui border border-white/10 bg-cover bg-center"
                style={{ backgroundImage: `url(${form.heroImage})` }}
              />
            ) : null}
          </label>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-gold">Ticket tiers</p>
              <p className="mt-1 text-xs leading-5 text-paper/42">
                Each tier is a ticket type fans can buy, like Early Bird or VIP. Untick &quot;On sale&quot; to hide one without deleting it.
              </p>
            </div>
            <button
              onClick={() => setForm((current) => (current ? { ...current, ticketTiers: [...current.ticketTiers, emptyTier()] } : current))}
              className="focus-ring inline-flex h-9 items-center gap-2 rounded-ui border border-white/12 px-3 text-xs font-black text-paper/72 hover:border-paper hover:text-paper"
            >
              <Plus size={14} />
              Add tier
            </button>
          </div>

          <div className="mt-3 grid gap-3">
            {form.ticketTiers.map((tier, index) => (
              <div key={tier.id ?? `new-${index}`} className="rounded-ui border border-white/10 p-4">
                <div className="grid gap-3 md:grid-cols-[1.2fr_.7fr_.7fr]">
                  <label className="grid gap-1.5 text-xs font-black uppercase text-paper/45">
                    Tier name
                    <input
                      value={tier.name}
                      onChange={(event) => updateTier(index, { name: event.target.value })}
                      className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm font-normal normal-case text-paper"
                      placeholder="Early Bird"
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-black uppercase text-paper/45">
                    Price (naira)
                    <input
                      value={tier.priceNaira}
                      onChange={(event) => updateTier(index, { priceNaira: event.target.value })}
                      className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm font-normal normal-case text-paper"
                      type="number"
                      min={0}
                      placeholder="3500"
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-black uppercase text-paper/45">
                    Tickets available
                    <input
                      value={tier.capacity}
                      onChange={(event) => updateTier(index, { capacity: event.target.value })}
                      className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm font-normal normal-case text-paper"
                      type="number"
                      min={1}
                      placeholder="500"
                    />
                  </label>
                </div>
                <label className="mt-3 grid gap-1.5 text-xs font-black uppercase text-paper/45">
                  Perks (one per line)
                  <textarea
                    value={tier.perksText}
                    onChange={(event) => updateTier(index, { perksText: event.target.value })}
                    className="min-h-16 rounded-ui border border-white/10 bg-ink p-2.5 text-xs font-normal normal-case leading-5 text-paper"
                    placeholder={"Early access\nFree barbing"}
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-paper/60">
                    <input
                      type="checkbox"
                      checked={tier.isActive}
                      onChange={(event) => updateTier(index, { isActive: event.target.checked })}
                      className="size-4 accent-gold"
                    />
                    On sale
                  </label>
                  {tier.id ? (
                    <p className="text-xs text-paper/42">{tier.soldCount} sold so far</p>
                  ) : (
                    <button
                      onClick={() =>
                        setForm((current) =>
                          current
                            ? { ...current, ticketTiers: current.ticketTiers.filter((_, tierIndex) => tierIndex !== index) }
                            : current,
                        )
                      }
                      className="focus-ring inline-flex items-center gap-1.5 rounded-ui border border-lava/40 px-3 py-1.5 text-xs font-black text-lava hover:bg-lava/10"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
          <button
            onClick={saveEvent}
            disabled={isSaving}
            className="focus-ring h-11 rounded-ui bg-gold px-6 text-sm font-black text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : form.id ? "Save changes" : "Create event"}
          </button>
          <p className="text-xs text-paper/42">Changes go live on the site as soon as you save.</p>
        </div>
      </section>
    </div>
  );
}
