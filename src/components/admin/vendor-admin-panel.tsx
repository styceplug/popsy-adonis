"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, ImagePlus, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { normalizeVendorSlug } from "@/lib/vendors";

type MediaItem = { url: string; type: "image" | "video"; caption: string };

export type AdminVendor = {
  id: string;
  name: string;
  slug: string;
  category: string;
  tagline: string;
  description: string;
  location: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  website: string;
  logoUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  media: MediaItem[];
};

type FormState = Omit<AdminVendor, "id"> & { id?: string };

const suggestedCategories = [
  "Photography",
  "Videography",
  "DJ",
  "MC / Host",
  "Makeup",
  "Hair & Barbing",
  "Fashion & Tailoring",
  "Event Decor",
  "Catering & Drinks",
  "Sound & Lighting",
  "Venue",
  "Printing & Branding",
  "Tattoo & Piercing",
  "Logistics",
];

const UPLOAD_FOLDER = "popsy-adonis/vendors";
const inputStyles = "h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper";

function emptyVendor(): FormState {
  return {
    name: "",
    slug: "",
    category: "",
    tagline: "",
    description: "",
    location: "",
    phone: "",
    whatsapp: "",
    email: "",
    instagram: "",
    website: "",
    logoUrl: "",
    isActive: true,
    isFeatured: false,
    media: [],
  };
}

function Field({
  label,
  hint,
  children,
  wide,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`grid gap-2 text-sm font-bold text-paper/72 ${wide ? "md:col-span-2" : ""}`}>
      {label}
      {children}
      {hint ? <span className="text-xs font-normal leading-5 text-paper/42">{hint}</span> : null}
    </label>
  );
}

export function VendorAdminPanel({ vendors }: { vendors: AdminVendor[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const mediaInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () => [...new Set([...vendors.map((vendor) => vendor.category), ...suggestedCategories])].sort(),
    [vendors],
  );

  function update(patch: Partial<FormState>) {
    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  function open(next: FormState) {
    setForm(next);
    setFeedback(null);
    setUploadStatus("");
    window.scrollTo({ top: 0 });
  }

  async function uploadFiles(files: FileList | null, target: "media" | "logo") {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const errors: string[] = [];

    for (const [index, file] of list.entries()) {
      setUploadStatus(`Uploading ${index + 1} of ${list.length}: ${file.name}`);
      try {
        const uploaded = await uploadToCloudinary(file, UPLOAD_FOLDER);
        if (target === "logo") {
          if (uploaded.type !== "image") throw new Error(`${file.name}: the logo must be a photo.`);
          update({ logoUrl: uploaded.url });
        } else {
          setForm((current) =>
            current ? { ...current, media: [...current.media, { url: uploaded.url, type: uploaded.type, caption: "" }] } : current,
          );
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${file.name}: upload failed.`);
      }
    }

    setUploadStatus(errors.length ? errors.join(" ") : `Uploaded ${list.length} file${list.length === 1 ? "" : "s"}. Save to publish.`);
    if (mediaInput.current) mediaInput.current.value = "";
    if (logoInput.current) logoInput.current.value = "";
  }

  function moveMedia(index: number, step: -1 | 1) {
    setForm((current) => {
      if (!current) return current;
      const media = [...current.media];
      const target = index + step;
      if (target < 0 || target >= media.length) return current;
      [media[index], media[target]] = [media[target], media[index]];
      return { ...current, media };
    });
  }

  async function save() {
    if (!form || isSaving) return;
    setIsSaving(true);
    setFeedback(null);

    const response = await fetch("/api/admin/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug: form.slug || normalizeVendorSlug(form.name) }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    setIsSaving(false);

    if (!response?.ok) {
      setFeedback({ tone: "error", message: payload?.message ?? "Unable to save vendor." });
      return;
    }

    setFeedback({ tone: "success", message: "Saved. The Vendors page is updated." });
    update({ id: payload.vendor.id, slug: payload.vendor.slug });
    router.refresh();
  }

  async function remove() {
    if (!form?.id) return;
    if (!window.confirm(`Delete ${form.name}? This removes their profile from the site. To hide them for now, untick "Show on site" instead.`)) return;
    const response = await fetch(`/api/admin/vendors/${form.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setFeedback({ tone: "error", message: "Unable to delete vendor." });
      return;
    }
    setForm(null);
    router.refresh();
  }

  if (!form) {
    return (
      <div>
        <button
          type="button"
          onClick={() => open(emptyVendor())}
          className="focus-ring inline-flex h-11 items-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper"
        >
          <Plus size={16} />
          Add vendor
        </button>
        <div className="mt-5 grid gap-3">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="flex flex-wrap items-center gap-4 rounded-ui border border-white/10 bg-white/[0.035] p-4">
              <div
                className="size-14 shrink-0 rounded-ui border border-white/10 bg-white/5 bg-cover bg-center"
                style={vendor.logoUrl ? { backgroundImage: `url(${vendor.logoUrl})` } : undefined}
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-black">{vendor.name}</p>
                <p className="text-xs text-paper/50">
                  {vendor.category} · {vendor.media.length} portfolio item{vendor.media.length === 1 ? "" : "s"}
                  {vendor.isFeatured ? " · Featured" : ""}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase ${
                  vendor.isActive ? "border-gold/40 bg-gold/10 text-gold" : "border-white/15 text-paper/50"
                }`}
              >
                {vendor.isActive ? "On site" : "Hidden"}
              </span>
              <button
                type="button"
                onClick={() => open({ ...vendor })}
                className="focus-ring inline-flex h-9 items-center gap-2 rounded-ui border border-white/12 px-3 text-xs font-black text-paper/72 hover:border-paper hover:text-paper"
              >
                <Pencil size={14} />
                Edit
              </button>
            </div>
          ))}
          {vendors.length === 0 ? (
            <p className="rounded-ui border border-white/10 bg-white/[0.035] p-6 text-sm text-paper/55">
              No vendors yet. Add the first one.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setForm(null)}
          className="inline-flex items-center gap-2 text-sm font-bold text-paper/60 hover:text-paper"
        >
          <ArrowLeft size={16} />
          All vendors
        </button>
        {form.id && form.isActive ? (
          <a
            href={`/vendors/${form.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-black text-gold hover:text-paper"
          >
            View on site <ExternalLink size={13} />
          </a>
        ) : null}
      </div>
      <h3 className="mt-4 font-display text-3xl font-black">{form.id ? form.name || "Edit vendor" : "New vendor"}</h3>

      {feedback ? (
        <p
          className={`mt-4 rounded-ui border p-3 text-sm ${
            feedback.tone === "success" ? "border-gold/40 bg-gold/10 text-gold" : "border-lava/40 bg-lava/10 text-lava"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Business name">
          <input
            value={form.name}
            onChange={(event) =>
              update({ name: event.target.value, slug: form.id ? form.slug : normalizeVendorSlug(event.target.value) })
            }
            className={inputStyles}
            placeholder="Lens by Tobi"
          />
        </Field>
        <Field label="Service" hint="What they are approved for. Pick one or type a new one.">
          <input
            value={form.category}
            onChange={(event) => update({ category: event.target.value })}
            className={inputStyles}
            list="vendor-categories"
            placeholder="Photography"
          />
          <datalist id="vendor-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>
        <Field label="Short line (optional)" hint="Shown under their name, e.g. Event and portrait photography in Ekiti." wide>
          <input value={form.tagline} onChange={(event) => update({ tagline: event.target.value })} className={inputStyles} />
        </Field>
        <Field label="About" wide>
          <textarea
            value={form.description}
            onChange={(event) => update({ description: event.target.value })}
            className="min-h-32 rounded-ui border border-white/10 bg-ink p-3 text-sm leading-6 text-paper"
            placeholder="What they do, who they have worked with, why we recommend them."
          />
        </Field>
        <Field label="Location (optional)">
          <input value={form.location} onChange={(event) => update({ location: event.target.value })} className={inputStyles} placeholder="Ado-Ekiti" />
        </Field>
        <Field label="Link name" hint={`Their page becomes /vendors/${form.slug || "business-name"}.`}>
          <input
            value={form.slug}
            onChange={(event) => update({ slug: normalizeVendorSlug(event.target.value) })}
            className={inputStyles}
          />
        </Field>
      </div>

      <p className="mt-8 text-xs font-black uppercase text-gold">Contact</p>
      <p className="mt-1 text-xs text-paper/42">Fill in any that apply. Each one becomes a contact button on their profile.</p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <Field label="WhatsApp number">
          <input value={form.whatsapp} onChange={(event) => update({ whatsapp: event.target.value })} className={inputStyles} placeholder="0803 123 4567" />
        </Field>
        <Field label="Phone number">
          <input value={form.phone} onChange={(event) => update({ phone: event.target.value })} className={inputStyles} placeholder="0803 123 4567" />
        </Field>
        <Field label="Instagram">
          <input value={form.instagram} onChange={(event) => update({ instagram: event.target.value })} className={inputStyles} placeholder="@handle" />
        </Field>
        <Field label="Email">
          <input value={form.email} onChange={(event) => update({ email: event.target.value })} className={inputStyles} type="email" placeholder="hello@business.com" />
        </Field>
        <Field label="Website">
          <input value={form.website} onChange={(event) => update({ website: event.target.value })} className={inputStyles} placeholder="business.com" />
        </Field>
      </div>

      <p className="mt-8 text-xs font-black uppercase text-gold">Logo</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div
          className="size-20 rounded-ui border border-white/10 bg-white/5 bg-cover bg-center"
          style={form.logoUrl ? { backgroundImage: `url(${form.logoUrl})` } : undefined}
        />
        <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(event) => uploadFiles(event.target.files, "logo")} />
        <button
          type="button"
          onClick={() => logoInput.current?.click()}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-ui border border-white/12 px-4 text-sm font-black text-paper/72 hover:border-paper hover:text-paper"
        >
          <Upload size={15} />
          {form.logoUrl ? "Change logo" : "Upload logo"}
        </button>
        {form.logoUrl ? (
          <button type="button" onClick={() => update({ logoUrl: "" })} className="text-xs font-bold text-paper/50 hover:text-lava">
            Remove
          </button>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-gold">Portfolio</p>
          <p className="mt-1 text-xs text-paper/42">Photos up to 10MB, videos up to 100MB. The first item is the cover on the Vendors list.</p>
        </div>
        <input
          ref={mediaInput}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(event) => uploadFiles(event.target.files, "media")}
        />
        <button
          type="button"
          onClick={() => mediaInput.current?.click()}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-ui bg-gold px-4 text-sm font-black text-ink hover:bg-paper"
        >
          <ImagePlus size={16} />
          Add photos or videos
        </button>
      </div>
      {uploadStatus ? <p className="mt-3 rounded-ui border border-white/10 bg-ink p-3 text-xs text-paper/68">{uploadStatus}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {form.media.map((item, index) => (
          <div key={item.url} className="rounded-ui border border-white/10 bg-ink p-3">
            {item.type === "video" ? (
              <video src={item.url} className="aspect-video w-full rounded-ui bg-black object-cover" controls preload="metadata" />
            ) : (
              <div className="aspect-video w-full rounded-ui bg-cover bg-center" style={{ backgroundImage: `url(${item.url})` }} />
            )}
            <input
              value={item.caption}
              onChange={(event) =>
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        media: current.media.map((mediaItem, mediaIndex) =>
                          mediaIndex === index ? { ...mediaItem, caption: event.target.value } : mediaItem,
                        ),
                      }
                    : current,
                )
              }
              className="mt-2 h-9 w-full rounded-ui border border-white/10 bg-ink px-2.5 text-xs text-paper"
              placeholder="Caption (optional)"
              maxLength={160}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-1">
                <button type="button" onClick={() => moveMedia(index, -1)} disabled={index === 0} className="grid size-8 place-items-center rounded-ui border border-white/10 text-paper/60 disabled:opacity-30" aria-label="Move earlier">
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => moveMedia(index, 1)} disabled={index === form.media.length - 1} className="grid size-8 place-items-center rounded-ui border border-white/10 text-paper/60 disabled:opacity-30" aria-label="Move later">
                  <ArrowDown size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => update({ media: form.media.filter((_, mediaIndex) => mediaIndex !== index) })}
                className="inline-flex items-center gap-1 text-xs font-bold text-paper/50 hover:text-lava"
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-white/10 pt-5">
        <label className="flex items-center gap-2 text-sm font-bold text-paper/68">
          <input type="checkbox" checked={form.isActive} onChange={(event) => update({ isActive: event.target.checked })} className="size-4 accent-gold" />
          Show on site
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-paper/68">
          <input type="checkbox" checked={form.isFeatured} onChange={(event) => update({ isFeatured: event.target.checked })} className="size-4 accent-gold" />
          Featured (listed first)
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isSaving || uploadStatus.startsWith("Uploading")}
          className="focus-ring h-11 rounded-ui bg-gold px-6 text-sm font-black text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : form.id ? "Save changes" : "Add vendor"}
        </button>
        {form.id ? (
          <button
            type="button"
            onClick={remove}
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-ui border border-lava/40 px-4 text-sm font-black text-lava hover:bg-lava/10"
          >
            <Trash2 size={15} />
            Delete vendor
          </button>
        ) : null}
      </div>
    </section>
  );
}
