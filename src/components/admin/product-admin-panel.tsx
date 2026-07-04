"use client";

import { useMemo, useState } from "react";

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

function emptyVariant(): ProductFormVariant {
  return {
    sku: "",
    size: "M",
    color: "",
    priceNaira: "25000",
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

export function ProductAdminPanel({ products }: { products: AdminProduct[] }) {
  const [productList, setProductList] = useState(products);
  const [form, setForm] = useState<ProductFormState>(() => emptyProduct());
  const [status, setStatus] = useState("");
  const isEditing = Boolean(form.id);
  const previewImages = useMemo(
    () => form.imagesText.split(/\n+/).map((line) => line.trim()).filter(Boolean),
    [form.imagesText],
  );

  function updateVariant(index: number, patch: Partial<ProductFormVariant>) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  }

  async function saveProduct() {
    setStatus("Saving product...");
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

    if (!response.ok) {
      setStatus(payload?.message ?? "Unable to save product.");
      return;
    }

    setStatus("Product saved. Refresh to see the latest catalog everywhere.");
    setProductList((current) =>
      current.some((product) => product.id === payload.product.id)
        ? current.map((product) => (product.id === payload.product.id ? { ...product, ...payload.product } : product))
        : [payload.product, ...current],
    );
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-gold">Catalog editor</p>
            <h3 className="mt-2 font-display text-3xl font-black">{isEditing ? "Edit product" : "Create product"}</h3>
          </div>
          <button
            onClick={() => {
              setForm(emptyProduct());
              setStatus("");
            }}
            className="focus-ring h-10 rounded-ui border border-white/12 px-4 text-sm font-bold text-paper/72 hover:border-paper hover:text-paper"
          >
            New product
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Slug
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72 md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="min-h-32 rounded-ui border border-white/10 bg-ink p-3 text-sm leading-6 text-paper"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Status
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductFormState["status"] }))}
              className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-paper/72 md:col-span-2">
            Images, first image is listing image
            <textarea
              value={form.imagesText}
              onChange={(event) => setForm((current) => ({ ...current, imagesText: event.target.value }))}
              className="min-h-24 rounded-ui border border-white/10 bg-ink p-3 font-mono text-xs leading-5 text-paper"
              placeholder="/PA%20FLUX/example/front.jpeg"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase text-gold">Variants</p>
            <button
              onClick={() => setForm((current) => ({ ...current, variants: [...current.variants, emptyVariant()] }))}
              className="focus-ring h-9 rounded-ui border border-white/12 px-3 text-xs font-black text-paper/72 hover:border-paper hover:text-paper"
            >
              Add variant
            </button>
          </div>
          {form.variants.map((variant, index) => (
            <div key={variant.id ?? index} className="grid gap-3 rounded-ui border border-white/10 p-3 md:grid-cols-[1fr_.6fr_.8fr_.6fr_.5fr]">
              <input value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" placeholder="SKU" />
              <input value={variant.size} onChange={(event) => updateVariant(index, { size: event.target.value })} className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" placeholder="Size" />
              <input value={variant.color} onChange={(event) => updateVariant(index, { color: event.target.value })} className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" placeholder="Color" />
              <input value={variant.priceNaira} onChange={(event) => updateVariant(index, { priceNaira: event.target.value })} className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" type="number" min={0} placeholder="Price" />
              <input value={variant.stock} onChange={(event) => updateVariant(index, { stock: event.target.value })} className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper" type="number" min={0} placeholder="Stock" />
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={saveProduct} className="focus-ring h-11 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper">
            Save product
          </button>
          {status ? <p className="text-sm font-bold text-paper/60">{status}</p> : null}
        </div>
      </section>

      <section className="grid gap-3">
        {productList.map((product) => (
          <button
            key={product.id}
            onClick={() => {
              setForm(productToForm(product));
              setStatus("");
            }}
            className="focus-ring rounded-ui border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-gold/50"
          >
            <span className="flex flex-wrap items-start justify-between gap-3">
              <span>
                <span className="block font-display text-2xl font-black text-paper">{product.name}</span>
                <span className="mt-1 block text-xs text-paper/45">{product.slug}</span>
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-gold">{product.status}</span>
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
