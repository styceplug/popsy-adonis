import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  initializePaystackTransaction,
  makePaymentReference,
} from "@/lib/paystack";
import { calculateTransactionFee } from "@/lib/fees";
import { prisma } from "@/lib/prisma";

const checkoutSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  customerName: z.string().optional(),
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

  const { email, phone, customerName, items } = parsed.data;
  const reference = makePaymentReference();

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const orderItems = [];

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

          orderItems.push({
            itemType: "ticket",
            ticketTierId: tier.id,
            title: `${tier.event.title} - ${tier.name}`,
            quantity: item.quantity,
            unitKobo: tier.priceKobo,
            totalKobo: tier.priceKobo * item.quantity,
            metadata: {
              eventId: tier.eventId,
              ticketTierId: tier.id,
              attendeeNames: item.attendeeNames ?? [],
            },
          });
        }
      }

      const subtotalKobo = orderItems.reduce((sum, item) => sum + item.totalKobo, 0);
      const transactionFeeKobo = calculateTransactionFee(subtotalKobo);
      const developerFeeKobo = transactionFeeKobo;
      const adonisAmountKobo = subtotalKobo;
      const totalKobo = subtotalKobo + transactionFeeKobo;

      const order = await tx.order.create({
        data: {
          email,
          phone,
          subtotalKobo,
          platformFeeKobo: developerFeeKobo,
          transactionFeeKobo,
          totalKobo,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      const transaction = await tx.transaction.create({
        data: {
          orderId: order.id,
          reference,
          amountKobo: totalKobo,
          developerFeeKobo,
          adonisAmountKobo,
          transactionFeeKobo,
          splitCode: process.env.PAYSTACK_ADONIS_SUBACCOUNT_CODE,
        },
      });

      return { order, transaction };
    });

    const paystack = await initializePaystackTransaction({
      email,
      amount: result.order.totalKobo,
      reference,
      orderId: result.order.id,
      developerFeeKobo: result.transaction.developerFeeKobo,
      adonisAmountKobo: result.transaction.adonisAmountKobo,
      transactionFeeKobo: result.transaction.transactionFeeKobo,
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
