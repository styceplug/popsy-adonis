// Display helpers for PA FLUX products. Pure functions, safe to use in server and client components.
import type { Product } from "@/lib/sample-data";

/**
 * Splits "Stay in Flux Tee - Midnight Black" into the product family ("Stay in Flux Tee")
 * and the colourway ("Midnight Black"). Colourways are stored as separate products, so the
 * family is what ties them together on the store.
 */
export function splitProductName(name: string): { family: string; variant: string | null } {
  const match = name.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (!match) return { family: name, variant: null };
  return { family: match[1].trim(), variant: match[2].trim() };
}

export type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

/**
 * Turns the plain-text description typed in admin into blocks: blank lines separate
 * paragraphs, lines starting with "-" become a list, and a short ALL-CAPS line is a heading.
 */
export function parseDescription(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];

  for (const chunk of text.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    let paragraph: string[] = [];
    let list: string[] = [];

    const flushParagraph = () => {
      if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    };
    const flushList = () => {
      if (list.length) blocks.push({ type: "list", items: list });
      list = [];
    };

    for (const line of lines) {
      const bullet = line.match(/^[-*•]\s+(.+)$/);
      if (bullet) {
        flushParagraph();
        list.push(bullet[1]);
        continue;
      }

      flushList();
      const isHeading =
        line.length <= 40 && /[A-Z]/.test(line) && line === line.toUpperCase() && !/[.!?]$/.test(line);
      if (isHeading) {
        flushParagraph();
        blocks.push({ type: "heading", text: line });
        continue;
      }

      paragraph.push(line);
    }

    flushParagraph();
    flushList();
  }

  return blocks;
}

/** Lowest variant price, and whether other variants cost more. */
export function getPriceRange(product: Product) {
  const prices = product.variants.map((variant) => variant.priceKobo);
  if (prices.length === 0) return { fromKobo: product.priceKobo, varies: false };
  const fromKobo = Math.min(...prices);
  return { fromKobo, varies: Math.max(...prices) > fromKobo };
}

export type StockState = "in-stock" | "low" | "sold-out";

/** Low means 10 or fewer units left across every size and colour. */
export function getStockState(product: Product): StockState {
  const total = product.variants.reduce((sum, variant) => sum + Math.max(variant.stock, 0), 0);
  if (total <= 0) return "sold-out";
  if (total <= 10) return "low";
  return "in-stock";
}

/** Sizes that still have stock, in the order they were set up. */
export function getAvailableSizes(product: Product) {
  return product.sizes.filter((size) => product.variants.some((variant) => variant.size === size && variant.stock > 0));
}
