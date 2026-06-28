import { OrderStatus, type Prisma } from "@prisma/client";
import { PROMO_RESERVATION_TTL_MS } from "@/lib/ticket-promo-constants";

export { PROMO_RESERVATION_TTL_MS };

export type ActiveTicketPromo = {
  id: string;
  ticketTierId: string;
  name: string;
  code: string;
  promoPriceKobo: number;
  startsAt: Date;
  endsAt: Date | null;
  quantityLimit: number;
  maxPerBuyer: number;
  isActive: boolean;
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
  ticketPromo: {
    findMany: (args: {
      where: {
        ticketTierId: string;
        isActive: boolean;
        startsAt: { lte: Date };
      };
      orderBy: Array<{ startsAt: "desc" } | { createdAt: "desc" }>;
      take: number;
    }) => Promise<ActiveTicketPromo[]>;
  };
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

function isReservedPromoItem(item: PromoOrderItem, promoCode: string, now: Date) {
  if (readMetadataValue(item.metadata, "promoCode") !== promoCode) return false;
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

export function getPromoFallbackEndAt(startsAt: Date) {
  const lagosDateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(startsAt);
  const year = Number(lagosDateParts.find((part) => part.type === "year")?.value);
  const month = Number(lagosDateParts.find((part) => part.type === "month")?.value);
  const day = Number(lagosDateParts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day, 22, 59, 59, 999));
}

function getPromoEffectiveEndAt(promo: ActiveTicketPromo) {
  return promo.endsAt ?? getPromoFallbackEndAt(promo.startsAt);
}

export async function getActiveTicketPromo(db: PromoReader, ticketTierId: string, now = new Date()) {
  const promos = await db.ticketPromo.findMany({
    where: {
      ticketTierId,
      isActive: true,
      startsAt: { lte: now },
    },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return promos.find((promo) => getPromoEffectiveEndAt(promo) > now) ?? null;
}

export async function getTicketPromoStatus(
  db: PromoReader,
  ticketTierId: string,
  options: { email?: string; phone?: string; now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const promo = await getActiveTicketPromo(db, ticketTierId, now);

  if (!promo) {
    return {
      active: false,
      promo: null,
      code: null,
      label: null,
      startsAt: null,
      endsAt: null,
      limit: 0,
      maxPerBuyer: 0,
      used: 0,
      remaining: 0,
      buyerUsed: 0,
      buyerRemaining: 0,
      tierId: ticketTierId,
      promoPriceKobo: null,
    };
  }

  const promoItems = await db.orderItem.findMany({
    where: {
      itemType: "ticket",
      ticketTierId,
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

  const reservedItems = promoItems.filter((item) => isReservedPromoItem(item, promo.code, now));
  const used = reservedItems.reduce((sum, item) => sum + item.quantity, 0);
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
  const buyerRemaining = Math.max(promo.maxPerBuyer - buyerUsed, 0);
  const remaining = Math.max(promo.quantityLimit - used, 0);
  const active = remaining > 0 && buyerRemaining > 0;

  return {
    active,
    promo,
    code: promo.code,
    label: promo.name,
    startsAt: promo.startsAt.toISOString(),
    endsAt: promo.endsAt?.toISOString() ?? null,
    limit: promo.quantityLimit,
    maxPerBuyer: promo.maxPerBuyer,
    used,
    remaining,
    buyerUsed,
    buyerRemaining,
    tierId: ticketTierId,
    promoPriceKobo: promo.promoPriceKobo,
  };
}
