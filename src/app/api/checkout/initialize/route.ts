import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  initializePaystackTransaction,
  makePaymentReference,
} from "@/lib/paystack";
import { affiliateRefCookieName } from "@/lib/affiliate-auth";
import { getEffectiveCommissionBps } from "@/lib/affiliates";
import { calculateBasisPointAmount, calculateCheckoutPaymentBreakdown } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { getTicketPromoStatus } from "@/lib/ticket-promos";

const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  customerName: z.string().optional(),
  joinMailingList: z.boolean().optional(),
  items: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("ticket"),
          eventId: z.string(),
          ticketTierId: z.string(),
          quantity: z.number().int().positive().max(10),
          attendeeNames: z.array(z.string()).optional(),
        }),
        z.object({
          type: z.literal("product"),
          variantId: z.string(),
          quantity: z.number().int().positive().max(20),
        }),
        z.object({
          type: z.literal("addon"),
          eventId: z.string(),
          eventAddOnId: z.string(),
          quantity: z.number().int().positive().max(20),
        }),
      ]),
    )
    .min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid checkout payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { email, phone, customerName, joinMailingList, items } = parsed.data;
  const reference = makePaymentReference();

  // Last affiliate link the buyer clicked. Buying through your own link earns nothing.
  const cookieStore = await cookies();
  const refCode = cookieStore.get(affiliateRefCookieName)?.value?.trim().toUpperCase();
  const referrer = refCode ? await prisma.affiliate.findUnique({ where: { code: refCode } }) : null;
  const affiliate =
    referrer && referrer.status === "APPROVED" && referrer.email.toLowerCase() !== email.trim().toLowerCase()
      ? referrer
      : null;

  if (joinMailingList) {
    const normalizedEmail = email.trim().toLowerCase();
    await prisma.waitlistSubscriber
      .upsert({
        where: { email: normalizedEmail },
        update: { isActive: true },
        create: { email: normalizedEmail, source: "TICKET_CHECKOUT" },
      })
      .catch(() => undefined);
  }

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const orderItems: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];
      const checkoutPromoQuantities = new Map<string, number>();
      const affiliateSales = new Map<string, { eventBps: number; ticketCount: number; subtotalKobo: number }>();
      const addAffiliateSale = (eventId: string, eventBps: number, ticketCount: number, subtotalKobo: number) => {
        const sale = affiliateSales.get(eventId) ?? { eventBps, ticketCount: 0, subtotalKobo: 0 };
        sale.ticketCount += ticketCount;
        sale.subtotalKobo += subtotalKobo;
        affiliateSales.set(eventId, sale);
      };

      for (const item of items) {
        if (item.type === "product") {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });

          if (!variant || variant.stock < item.quantity || variant.product.status !== "ACTIVE") {
            throw new Error("A product in your cart is unavailable.");
          }

          orderItems.push({
            itemType: "product",
            variantId: variant.id,
            title: variant.product.name,
            quantity: item.quantity,
            unitKobo: variant.priceKobo,
            totalKobo: variant.priceKobo * item.quantity,
            metadata: { sku: variant.sku, size: variant.size, color: variant.color },
          });
        }

        if (item.type === "addon") {
          const addOn = await tx.eventAddOn.findUnique({
            where: { id: item.eventAddOnId },
            include: { event: true },
          });

          if (!addOn || !addOn.isActive || addOn.eventId !== item.eventId || addOn.event.status !== "PUBLISHED") {
            throw new Error("An add-on in your cart is unavailable.");
          }

          const remaining = addOn.stock - addOn.soldCount;
          if (remaining < item.quantity) {
            throw new Error(`${addOn.name} is almost sold out. Only ${remaining} left.`);
          }

          orderItems.push({
            itemType: "addon",
            eventAddOnId: addOn.id,
            title: `${addOn.event.title} - ${addOn.name}`,
            quantity: item.quantity,
            unitKobo: addOn.priceKobo,
            totalKobo: addOn.priceKobo * item.quantity,
            metadata: {
              eventId: addOn.eventId,
              eventAddOnId: addOn.id,
              collectionType: "water-gun",
            },
          });
        }

        if (item.type === "ticket") {
          const tier = await tx.ticketTier.findUnique({
            where: { id: item.ticketTierId },
            include: { event: true },
          });

          if (!tier || !tier.isActive || tier.event.status !== "PUBLISHED") {
            throw new Error("A ticket in your cart is unavailable.");
          }

          const remaining = tier.capacity - tier.soldCount;
          if (remaining < item.quantity) {
            throw new Error(`${tier.name} tickets are almost sold out. Only ${remaining} left.`);
          }

          let promoQuantity = 0;
          await tx.ticketTier.update({
            where: { id: tier.id },
            data: { updatedAt: new Date() },
          });
          const promo = await getTicketPromoStatus(tx, tier.id, { email, phone });

          if (promo.promo) {
            const checkoutPromoQuantity = checkoutPromoQuantities.get(promo.code ?? "") ?? 0;
            const buyerRemainingInCheckout = Math.max(promo.buyerRemaining - checkoutPromoQuantity, 0);
            promoQuantity = promo.active ? Math.min(item.quantity, promo.remaining, buyerRemainingInCheckout) : 0;
            checkoutPromoQuantities.set(promo.code ?? "", checkoutPromoQuantity + promoQuantity);
          }

          if (promoQuantity > 0 && promo.promo && promo.code && promo.label && promo.promoPriceKobo) {
            addAffiliateSale(tier.eventId, tier.event.affiliateCommissionBps, promoQuantity, promo.promoPriceKobo * promoQuantity);
            orderItems.push({
              itemType: "ticket",
              ticketTierId: tier.id,
              title: `${tier.event.title} - ${tier.name} (${promo.label})`,
              quantity: promoQuantity,
              unitKobo: promo.promoPriceKobo,
              totalKobo: promo.promoPriceKobo * promoQuantity,
              metadata: {
                eventId: tier.eventId,
                ticketTierId: tier.id,
                attendeeNames: item.attendeeNames?.slice(0, promoQuantity) ?? [],
                promoId: promo.promo.id,
                promoCode: promo.code,
                promoLabel: promo.label,
                standardUnitKobo: tier.priceKobo,
              },
            });
          }

          const standardQuantity = item.quantity - promoQuantity;

          if (standardQuantity <= 0) continue;

          addAffiliateSale(tier.eventId, tier.event.affiliateCommissionBps, standardQuantity, tier.priceKobo * standardQuantity);

          orderItems.push({
            itemType: "ticket",
            ticketTierId: tier.id,
            title: `${tier.event.title} - ${tier.name}`,
            quantity: standardQuantity,
            unitKobo: tier.priceKobo,
            totalKobo: tier.priceKobo * standardQuantity,
            metadata: {
              eventId: tier.eventId,
              ticketTierId: tier.id,
              attendeeNames: item.attendeeNames?.slice(promoQuantity) ?? [],
            },
          });
        }
      }

      const subtotalKobo = orderItems.reduce((sum, item) => sum + item.totalKobo, 0);
      const ticketSubtotalKobo = orderItems
        .filter((item) => item.itemType === "ticket")
        .reduce((sum, item) => sum + item.totalKobo, 0);
      const eventAddOnSubtotalKobo = orderItems
        .filter((item) => item.itemType === "addon")
        .reduce((sum, item) => sum + item.totalKobo, 0);
      const productSubtotalKobo = orderItems
        .filter((item) => item.itemType === "product")
        .reduce((sum, item) => sum + item.totalKobo, 0);
      const feeSubtotalKobo = subtotalKobo;
      const nonTicketSubtotalKobo = subtotalKobo - ticketSubtotalKobo;
      const breakdown = calculateCheckoutPaymentBreakdown(ticketSubtotalKobo, feeSubtotalKobo);
      const transactionFeeKobo = breakdown.transactionFeeKobo;
      const estimatedGatewayFeeKobo = breakdown.estimatedGatewayFeeKobo;
      const developerFeeKobo = breakdown.dreamAmountKobo;
      // Commission is a share of ticket revenue only, and it comes out of the Adonis side.
      const affiliateCommissions = affiliate
        ? Array.from(affiliateSales, ([eventId, sale]) => {
            const rateBps = getEffectiveCommissionBps(sale.eventBps, affiliate.commissionBpsOverride);
            return {
              eventId,
              ticketCount: sale.ticketCount,
              ticketSubtotalKobo: sale.subtotalKobo,
              rateBps,
              amountKobo: calculateBasisPointAmount(sale.subtotalKobo, rateBps),
            };
          })
        : [];
      // Rates are capped at 50%, so this can never exceed the Adonis ticket share.
      const affiliateCommissionKobo = affiliateCommissions.reduce((sum, commission) => sum + commission.amountKobo, 0);
      const adonisAmountKobo = nonTicketSubtotalKobo + breakdown.adonisAmountKobo - affiliateCommissionKobo;
      const organizerCommissionKobo = breakdown.organizerCommissionKobo;
      const totalKobo = subtotalKobo + transactionFeeKobo;

      const order = await tx.order.create({
        data: {
          email,
          phone,
          subtotalKobo,
          platformFeeKobo: developerFeeKobo,
          transactionFeeKobo,
          totalKobo,
          affiliateId: affiliateCommissions.length > 0 ? affiliate?.id : undefined,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      if (affiliate && affiliateCommissions.length > 0) {
        await tx.affiliateCommission.createMany({
          data: affiliateCommissions.map((commission) => ({
            ...commission,
            affiliateId: affiliate.id,
            orderId: order.id,
          })),
        });
      }

      const transaction = await tx.transaction.create({
        data: {
          orderId: order.id,
          reference,
          amountKobo: totalKobo,
          developerFeeKobo,
          adonisAmountKobo,
          transactionFeeKobo,
          affiliateCommissionKobo,
          gatewayResponse: {
            affiliateCommissionKobo,
            ticketSubtotalKobo,
            eventAddOnSubtotalKobo,
            productSubtotalKobo,
            feeSubtotalKobo,
            nonTicketSubtotalKobo,
            estimatedGatewayFeeKobo,
            organizerCommissionKobo,
            dreamGrossKobo: developerFeeKobo,
          },
          splitCode: "dynamic_flat",
        },
      });

      return { order, transaction };
    }, {
      maxWait: 10_000,
      timeout: 20_000,
    });

    const paystack = await initializePaystackTransaction({
      email,
      amount: result.order.totalKobo,
      reference,
      orderId: result.order.id,
      developerFeeKobo: result.transaction.developerFeeKobo,
      adonisAmountKobo: result.transaction.adonisAmountKobo,
      transactionFeeKobo: result.transaction.transactionFeeKobo,
      affiliateCommissionKobo: result.transaction.affiliateCommissionKobo,
      affiliateCode: result.transaction.affiliateCommissionKobo > 0 ? affiliate?.code : undefined,
      estimatedGatewayFeeKobo:
        typeof result.transaction.gatewayResponse === "object" &&
        result.transaction.gatewayResponse &&
        "estimatedGatewayFeeKobo" in result.transaction.gatewayResponse
          ? Number(result.transaction.gatewayResponse.estimatedGatewayFeeKobo)
          : undefined,
      organizerCommissionKobo:
        typeof result.transaction.gatewayResponse === "object" &&
        result.transaction.gatewayResponse &&
        "organizerCommissionKobo" in result.transaction.gatewayResponse
          ? Number(result.transaction.gatewayResponse.organizerCommissionKobo)
          : undefined,
    });

    await prisma.transaction.update({
      where: { reference },
      data: {
        gatewayAccessCode: paystack.access_code,
        gatewayAuthUrl: paystack.authorization_url,
      },
    });

    return NextResponse.json(
      {
        orderId: result.order.id,
        reference,
        customerName,
        authorizationUrl: paystack.authorization_url,
        accessCode: paystack.access_code,
      },
      { status: 201 },
    );
  } catch (error) {
    await prisma.transaction
      .update({
        where: { reference },
        data: {
          status: "FAILED",
          gatewayResponse: {
            message: error instanceof Error ? error.message : "Unable to initialize checkout.",
          },
        },
      })
      .catch(() => undefined);

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to initialize checkout." },
      { status: 500 },
    );
  }
}
