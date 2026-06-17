import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
});

export const createTierSchema = z.object({
  productId: z.string().min(1),
  name: z.string().trim().min(1, "Tier name is required"),
  order: z.coerce.number().int(),
  basePricePerSeat: z.coerce.number().min(0, "Base price must be 0 or more"),
});

export const updateTierBasePriceSchema = z.object({
  tierId: z.string().min(1),
  basePricePerSeat: z.coerce.number().min(0, "Base price must be 0 or more"),
});

export const createFeatureSchema = z.object({
  productId: z.string().min(1),
  name: z.string().trim().min(1, "Feature name is required"),
});

export const updateFeatureAvailabilitySchema = z
  .object({
    featureId: z.string().min(1),
    tierId: z.string().min(1),
    availability: z.enum(["INCLUDED", "ADDON", "NOT_AVAILABLE"]),
    pricingModel: z.enum(["FIXED_MONTHLY", "PER_SEAT", "PERCENT_OF_PRODUCT"]).optional(),
    pricingValue: z.coerce.number().min(0).optional(),
  })
  .refine(
    (data) =>
      data.availability !== "ADDON" || (data.pricingModel !== undefined && data.pricingValue !== undefined),
    { message: "Add-ons require a pricing model and a value", path: ["pricingModel"] },
  );

export const addonSelectionSchema = z.object({
  featureId: z.string().min(1),
  seats: z.coerce.number().int().positive().optional(),
});

export const createQuoteSchema = z.object({
  name: z.string().trim().min(1, "Quote name is required"),
  customerName: z.string().trim().min(1, "Customer name is required"),
  productId: z.string().min(1),
  tierId: z.string().min(1),
  seats: z.coerce.number().int().positive("Seats must be at least 1"),
  termLength: z.enum(["MONTHLY", "ANNUAL", "TWO_YEAR"]),
  overallDiscountPercent: z.coerce.number().min(0).max(100).default(0),
  addons: z.array(addonSelectionSchema).default([]),
});
