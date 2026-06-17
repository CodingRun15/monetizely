"use server";

import { prisma } from "@/lib/db";
import { createQuoteSchema } from "@/lib/validation";
import { calculateQuote } from "@/lib/pricing";
import type { AddonCatalogInfo, PricingInput } from "@/lib/pricing.types";

export async function createQuote(input: unknown): Promise<{ id: string }> {
  const parsed = createQuoteSchema.parse(input);

  const [product, tier] = await Promise.all([
    prisma.product.findUniqueOrThrow({ where: { id: parsed.productId } }),
    prisma.tier.findUniqueOrThrow({
      where: { id: parsed.tierId },
      include: {
        availabilities: {
          where: { availability: "ADDON" },
          include: { addonPricing: true, feature: true },
        },
      },
    }),
  ]);

  const addonCatalog: AddonCatalogInfo[] = tier.availabilities
    .filter((a) => a.addonPricing)
    .map((a) => ({
      featureId: a.featureId,
      featureName: a.feature.name,
      pricingModel: a.addonPricing!.pricingModel,
      pricingValue: Number(a.addonPricing!.pricingValue),
    }));

  const pricingInput: PricingInput = {
    productName: product.name,
    tierName: tier.name,
    basePricePerSeat: Number(tier.basePricePerSeat),
    seats: parsed.seats,
    termLength: parsed.termLength,
    overallDiscountPercent: parsed.overallDiscountPercent,
    addons: parsed.addons,
    addonCatalog,
  };

  const result = calculateQuote(pricingInput);

  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        name: parsed.name,
        customerName: parsed.customerName,
        productId: parsed.productId,
        tierId: parsed.tierId,
        seats: parsed.seats,
        termLength: parsed.termLength,
        overallDiscountPercent: parsed.overallDiscountPercent,
        subtotal: result.subtotal,
        overallDiscountAmount: result.overallDiscountAmount,
        total: result.total,
      },
    });

    await tx.quoteLineItem.createMany({
      data: result.lineItems.map((item, index) => ({
        quoteId: created.id,
        order: index,
        label: item.label,
        description: item.description,
        notes: item.notes,
        amount: item.amount,
      })),
    });

    if (parsed.addons.length > 0) {
      await tx.quoteAddonSelection.createMany({
        data: parsed.addons.map((addon) => ({
          quoteId: created.id,
          featureId: addon.featureId,
          seats: addon.seats ?? null,
        })),
      });
    }

    return created;
  });

  return { id: quote.id };
}
