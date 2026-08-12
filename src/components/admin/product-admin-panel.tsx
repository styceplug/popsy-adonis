"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";

type AdminProductVariant = {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  priceKobo: number;
  stock: number;
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  images: string[];
  variants: AdminProductVariant[];
};

type ProductFormVariant = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  priceNaira: string;
  stock: string;
};

type ProductFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  imagesText: string;
  variants: ProductFormVariant[];
};

type Feedback = { tone: "success" | "error"; message: string };

const statusHints: Record<AdminProduct["status"], string> = {
  ACTIVE: "Live - shoppers can see and buy this product.",
  DRAFT: "Hidden - not shown in the store yet.",
  ARCHIVED: "Removed from the store, but kept in records.",
};

const statusChipStyles: Record<AdminProduct["status"], string> = {
  ACTIVE: "border-gold/40 bg-gold/10 text-gold",
  DRAFT: "border-white/15 text-paper/55",
  ARCHIVED: "border-lava/40 bg-lava/10 text-lava",
};

function emptyVariant(): ProductFormVariant {
  return {
    sku: "",
    size: "M",
    color: "",
    priceNaira: "",
    stock: "100",
  };
}

function emptyProduct(): ProductFormState {
  return {
    name: "",
    slug: "",
    description: "",
    status: "ACTIVE",
    imagesText: "",
    variants: [emptyVariant()],
  };
}

function productToForm(product: AdminProduct): ProductFormState {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    status: product.status,
    imagesText: product.images.join("\n"),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size ?? "",
      color: variant.color ?? "",
      priceNaira: String(variant.priceKobo / 100),
      stock: String(variant.stock),
    })),
  };
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const inputStyles = "h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper";
const variantLabelStyles = "grid gap-1.5 text-xs font-black uppercase text-paper/45";
const variantInputStyles = "h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm font-normal normal-case text-paper";

export function ProductAdminPanel({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const previewImages = useMemo(
    () => (form?.imagesText ?? "").split(/\n+/).map((line) => line.trim()).filter(Boolean),
    [form?.imagesText],
  );

  function openEditor(nextForm: ProductFormState) {
    setForm(nextForm);
    setFeedback(null);
    window.scrollTo({ top: 0 });
  }

  function updateVariant(index: number, patch: Partial<ProductFormVariant>) {
    setForm((current) =>
      current
        ? {
            ...current,
            variants: current.variants.map((variant, variantIndex) =>
              variantIndex === index ? { ...variant, ...patch } : variant,
            ),
          }
        : current,
    );
  }

  async function saveProduct() {
    if (!form || isSaving) return;

    setIsSaving(true);
    setFeedback(null);

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: form.id,
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description,
        status: form.status,
        images: previewImages,
        variants: form.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          priceNaira: Number(variant.priceNaira),
          stock: Number(variant.stock),
        })),
      }),
    });
    const payload = await response.json().catch(() => null);

    setIsSaving(false);

    if (!response.ok) {
      setFeedback({ tone: "error", message: payload?.message ?? "Unable to save product. Check the fields and try again." });
      return;
    }

    setForm((current) => (current ? { ...current, id: payload.product.id } : current));
    setFeedback({ tone: "success", message: "Saved. The store is updated." });
    router.refresh();
  }

  if (!form) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-paper/55">
            {products.length} product{products.length === 1 ? "" : "s"} · pick one to edit details, stock, or prices.
          </p>
          <button
            onClick={() => openEditor(emptyProduct())}
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper"
          >
            <Plus size={16} />
            New product
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {products.map((product) => {
            const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
            return (
              <button
                key={product.id}
                onClick={() => openEditor(productToForm(product))}
                className="focus-ring rounded-ui border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-gold/50"
              >
                <span className="flex flex-wrap items-start justify-between gap-3">
                  <span>
                    <span className="block font-display text-2xl font-black text-paper">{product.name}</span>
                    <span className="mt-1 block text-xs text-paper/45">
                      {product.variants.length} variant{product.variants.length === 1 ? "" : "s"} · {totalStock} in stock
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${statusChipStyles[product.status]}`}>
                      {product.status}
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
          {products.length === 0 ? (
            <p className="rounded-ui border border-white/10 p-5 text-sm text-paper/50">
              No products yet. Create your first product to open the store.
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
        All products
      </button>

      <section className="mt-4 rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <div>
          <p className="text-xs font-black uppercase text-gold">{form.id ? "Editing product" : "New product"}</p>
          <h3 className="mt-2 font-display text-3xl font-black">{form.name || "Untitled product"}</h3>
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
            Name
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, name: event.target.value, slug: current.id ? current.slug : slugify(event.target.value) } : current,
                )
              }
              className={inputStyles}
              placeholder="White FLUX Tee - The Becoming"
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
              The product page becomes /merch/{form.slug || "your-product"}. Filled in automatically from the name.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72 md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => (current ? { ...current, description: event.target.value } : current))}
              className="min-h-32 rounded-ui border border-white/10 bg-ink p-3 text-sm leading-6 text-paper"
              placeholder="The story behind the piece. At least a sentence or two."
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Visibility
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => (current ? { ...current, status: event.target.value as ProductFormState["status"] } : current))
              }
              className={inputStyles}
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <span className="text-xs font-normal leading-5 text-paper/42">{statusHints[form.status]}</span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72 md:col-span-2">
            Images
            <textarea
              value={form.imagesText}
              onChange={(event) => setForm((current) => (current ? { ...current, imagesText: event.target.value } : current))}
              className="min-h-24 rounded-ui border border-white/10 bg-ink p-3 font-mono text-xs leading-5 text-paper"
              placeholder="/PA%20FLUX/example/front.jpeg"
            />
            <span className="text-xs font-normal leading-5 text-paper/42">
              One image path per line. The first line is the cover image shoppers see in the store.
            </span>
          </label>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-gold">Variants</p>
              <p className="mt-1 text-xs leading-5 text-paper/42">
                Each size/color combination shoppers can buy, with its own price and stock.
              </p>
            </div>
            <button
              onClick={() => setForm((current) => (current ? { ...current, variants: [...current.variants, emptyVariant()] } : current))}
              className="focus-ring inline-flex h-9 items-center gap-2 rounded-ui border border-white/12 px-3 text-xs font-black text-paper/72 hover:border-paper hover:text-paper"
            >
              <Plus size={14} />
              Add variant
            </button>
          </div>

          <div className="mt-3 grid gap-3">
            {form.variants.map((variant, index) => (
              <div key={variant.id ?? `new-${index}`} className="rounded-ui border border-white/10 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_.5fr_.8fr_.7fr_.6fr]">
                  <label className={variantLabelStyles}>
                    SKU
                    <input
                      value={variant.sku}
                      onChange={(event) => updateVariant(index, { sku: event.target.value })}
                      className={variantInputStyles}
                      placeholder="flux-tee-white-m"
                    />
                  </label>
                  <label className={variantLabelStyles}>
                    Size
                    <input
                      value={variant.size}
                      onChange={(event) => updateVariant(index, { size: event.target.value })}
                      className={variantInputStyles}
                      placeholder="M"
                    />
                  </label>
                  <label className={variantLabelStyles}>
                    Color
                    <input
                      value={variant.color}
                      onChange={(event) => updateVariant(index, { color: event.target.value })}
                      className={variantInputStyles}
                      placeholder="White"
                    />
                  </label>
                  <label className={variantLabelStyles}>
                    Price (naira)
                    <input
                      value={variant.priceNaira}
                      onChange={(event) => updateVariant(index, { priceNaira: event.target.value })}
                      className={variantInputStyles}
                      type="number"
                      min={0}
                      placeholder="25000"
                    />
                  </label>
                  <label className={variantLabelStyles}>
                    In stock
                    <input
                      value={variant.stock}
                      onChange={(event) => updateVariant(index, { stock: event.target.value })}
                      className={variantInputStyles}
                      type="number"
                      min={0}
                      placeholder="100"
                    />
                  </label>
                </div>
                {!variant.id ? (
                  <button
                    onClick={() =>
                      setForm((current) =>
                        current
                          ? { ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }
                          : current,
                      )
                    }
                    className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-ui border border-lava/40 px-3 py-1.5 text-xs font-black text-lava hover:bg-lava/10"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
          <button
            onClick={saveProduct}
            disabled={isSaving}
            className="focus-ring h-11 rounded-ui bg-gold px-6 text-sm font-black text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : form.id ? "Save changes" : "Create product"}
          </button>
          <p className="text-xs text-paper/42">Changes go live in the store as soon as you save.</p>
        </div>
      </section>
    </div>
  );
}
