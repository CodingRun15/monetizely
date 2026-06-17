"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  createFeatureSchema,
  createProductSchema,
  createTierSchema,
  updateFeatureAvailabilitySchema,
  updateTierBasePriceSchema,
} from "@/lib/validation";

export async function createProduct(formData: FormData) {
  const { name } = createProductSchema.parse({ name: formData.get("name") });

  const product = await prisma.product.create({ data: { name } });

  revalidatePath("/catalog");
  redirect(`/catalog/products/${product.id}`);
}

export async function createTier(formData: FormData) {
  const input = createTierSchema.parse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    order: formData.get("order"),
    basePricePerSeat: formData.get("basePricePerSeat"),
  });

  await prisma.$transaction(async (tx) => {
    const tier = await tx.tier.create({
      data: {
        productId: input.productId,
        name: input.name,
        order: input.order,
        basePricePerSeat: input.basePricePerSeat,
      },
    });

    const features = await tx.feature.findMany({
      where: { productId: input.productId },
      select: { id: true },
    });

    if (features.length > 0) {
      await tx.featureTierAvailability.createMany({
        data: features.map((feature) => ({
          featureId: feature.id,
          tierId: tier.id,
          availability: "NOT_AVAILABLE" as const,
        })),
      });
    }
  });

  revalidatePath(`/catalog/products/${input.productId}`);
  redirect(`/catalog/products/${input.productId}`);
}

export async function updateTierBasePrice(formData: FormData) {
  const input = updateTierBasePriceSchema.parse({
    tierId: formData.get("tierId"),
    basePricePerSeat: formData.get("basePricePerSeat"),
  });
  const productId = String(formData.get("productId"));

  await prisma.tier.update({
    where: { id: input.tierId },
    data: { basePricePerSeat: input.basePricePerSeat },
  });

  revalidatePath(`/catalog/products/${productId}`);
  redirect(`/catalog/products/${productId}`);
}

export async function createFeature(formData: FormData) {
  const input = createFeatureSchema.parse({
    productId: formData.get("productId"),
    name: formData.get("name"),
  });

  await prisma.$transaction(async (tx) => {
    const feature = await tx.feature.create({
      data: { productId: input.productId, name: input.name },
    });

    const tiers = await tx.tier.findMany({
      where: { productId: input.productId },
      select: { id: true },
    });

    if (tiers.length > 0) {
      await tx.featureTierAvailability.createMany({
        data: tiers.map((tier) => ({
          featureId: feature.id,
          tierId: tier.id,
          availability: "NOT_AVAILABLE" as const,
        })),
      });
    }
  });

  revalidatePath(`/catalog/products/${input.productId}`);
  redirect(`/catalog/products/${input.productId}`);
}

export async function updateFeatureAvailability(formData: FormData) {
  const raw = {
    featureId: formData.get("featureId"),
    tierId: formData.get("tierId"),
    availability: formData.get("availability"),
    pricingModel: formData.get("pricingModel") || undefined,
    pricingValue: formData.get("pricingValue") || undefined,
  };
  const input = updateFeatureAvailabilitySchema.parse(raw);
  const productId = String(formData.get("productId"));

  await prisma.$transaction(async (tx) => {
    const row = await tx.featureTierAvailability.upsert({
      where: { featureId_tierId: { featureId: input.featureId, tierId: input.tierId } },
      create: {
        featureId: input.featureId,
        tierId: input.tierId,
        availability: input.availability,
      },
      update: { availability: input.availability },
    });

    if (input.availability === "ADDON") {
      await tx.addonPricing.upsert({
        where: { featureTierAvailabilityId: row.id },
        create: {
          featureTierAvailabilityId: row.id,
          pricingModel: input.pricingModel!,
          pricingValue: input.pricingValue!,
        },
        update: {
          pricingModel: input.pricingModel!,
          pricingValue: input.pricingValue!,
        },
      });
    } else {
      await tx.addonPricing.deleteMany({ where: { featureTierAvailabilityId: row.id } });
    }
  });

  revalidatePath(`/catalog/products/${productId}`);
  redirect(`/catalog/products/${productId}`);
}
