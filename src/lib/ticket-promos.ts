import { OrderStatus, type Prisma } from "@prisma/client";
import {
  EARLY_BIRD_PROMO_CODE,
  EARLY_BIRD_PROMO_LABEL,
  EARLY_BIRD_PROMO_LIMIT,
  EARLY_BIRD_PROMO_MAX_PER_BUYER,
  EARLY_BIRD_PROMO_PRICE_KOBO,
  EARLY_BIRD_PROMO_START_AT,
  EARLY_BIRD_PROMO_TIER_ID,
  PROMO_RESERVATION_TTL_MS,
} from "@/lib/ticket-promo-constants";

export {
  EARLY_BIRD_PROMO_CODE,
  EARLY_BIRD_PROMO_LABEL,
  EARLY_BIRD_PROMO_LIMIT,
  EARLY_BIRD_PROMO_MAX_PER_BUYER,
  EARLY_BIRD_PROMO_PRICE_KOBO,
  EARLY_BIRD_PROMO_START_AT,
  EARLY_BIRD_PROMO_TIER_ID,
  PROMO_RESERVATION_TTL_MS,
};

type PromoOrderItem = {
  quantity: number;
  metadata: Prisma.JsonValue | null;
  order: {
    status: OrderStatus;
    createdAt: Date;
    email: string;
    phone: string | null;
  };
};

type PromoReader = {
  orderItem: {
    findMany: (args: {
      where: {
        itemType: string;
        ticketTierId: string;
      };
      include: {
        order: {
          select: {
            status: true;
            createdAt: true;
            email: true;
            phone: true;
          };
        };
      };
    }) => Promise<PromoOrderItem[]>;
  };
};

function readMetadataValue(metadata: Prisma.JsonValue | null, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  return (metadata as Record<string, Prisma.JsonValue>)[key];
}

function isReservedPromoItem(item: PromoOrderItem, now: Date) {
  if (readMetadataValue(item.metadata, "promoCode") !== EARLY_BIRD_PROMO_CODE) return false;
  if (item.order.status === OrderStatus.PAID || item.order.status === OrderStatus.FULFILLED) return true;
  if (item.order.status !== OrderStatus.PENDING) return false;

  return now.getTime() - item.order.createdAt.getTime() <= PROMO_RESERVATION_TTL_MS;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

function normalizePhone(phone?: string | null) {
  return phone?.replace(/\D/g, "") ?? "";
}

export function isEarlyBirdPromoActive(now = new Date()) {
  return now >= EARLY_BIRD_PROMO_START_AT;
}

export async function getEarlyBirdPromoStatus(
  db: PromoReader,
  options: { email?: string; phone?: string; now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const promoItems = await db.orderItem.findMany({
    where: {
      itemType: "ticket",
      ticketTierId: EARLY_BIRD_PROMO_TIER_ID,
    },
    include: {
      order: {
        select: {
          status: true,
          createdAt: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const reservedItems = promoItems.filter((item) => isReservedPromoItem(item, now));
  const used = reservedItems
    .reduce((sum, item) => sum + item.quantity, 0);
  const buyerEmail = normalizeEmail(options.email);
  const buyerPhone = normalizePhone(options.phone);
  const buyerUsed = buyerEmail || buyerPhone
    ? reservedItems
        .filter((item) => {
          const orderEmail = normalizeEmail(item.order.email);
          const orderPhone = normalizePhone(item.order.phone);

          return Boolean(
            (buyerEmail && orderEmail === buyerEmail) ||
              (buyerPhone && orderPhone === buyerPhone),
          );
        })
        .reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  const buyerRemaining = Math.max(EARLY_BIRD_PROMO_MAX_PER_BUYER - buyerUsed, 0);
  const remaining = Math.max(EARLY_BIRD_PROMO_LIMIT - used, 0);
  const active = isEarlyBirdPromoActive(now) && remaining > 0 && buyerRemaining > 0;

  return {
    active,
    code: EARLY_BIRD_PROMO_CODE,
    label: EARLY_BIRD_PROMO_LABEL,
    startsAt: EARLY_BIRD_PROMO_START_AT.toISOString(),
    limit: EARLY_BIRD_PROMO_LIMIT,
    maxPerBuyer: EARLY_BIRD_PROMO_MAX_PER_BUYER,
    used,
    remaining,
    buyerUsed,
    buyerRemaining,
    tierId: EARLY_BIRD_PROMO_TIER_ID,
    promoPriceKobo: EARLY_BIRD_PROMO_PRICE_KOBO,
  };
}
