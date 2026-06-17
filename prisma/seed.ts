import "dotenv/config";
import { prisma } from "../lib/db";

const PRODUCT_NAME = "Analytics Suite";

const TIERS = [
  { name: "Starter", order: 0, basePricePerSeat: 25 },
  { name: "Growth", order: 1, basePricePerSeat: 50 },
  { name: "Enterprise", order: 2, basePricePerSeat: 100 },
] as const;

type Availability = "INCLUDED" | "ADDON" | "NOT_AVAILABLE";
type PricingModel = "FIXED_MONTHLY" | "PER_SEAT" | "PERCENT_OF_PRODUCT";

interface FeatureDefinition {
  name: string;
  availability: Record<(typeof TIERS)[number]["name"], Availability>;
  addonPricing?: Partial<Record<(typeof TIERS)[number]["name"], { model: PricingModel; value: number }>>;
}

// Mirrors catalog-example.xlsx exactly: "Feature Matrix" + "Add-on Pricing" sheets.
const FEATURES: FeatureDefinition[] = [
  {
    name: "Real-time dashboards",
    availability: { Starter: "INCLUDED", Growth: "INCLUDED", Enterprise: "INCLUDED" },
  },
  {
    name: "Custom reports",
    availability: { Starter: "NOT_AVAILABLE", Growth: "INCLUDED", Enterprise: "INCLUDED" },
  },
  {
    name: "API access",
    availability: { Starter: "NOT_AVAILABLE", Growth: "ADDON", Enterprise: "INCLUDED" },
    addonPricing: { Growth: { model: "PER_SEAT", value: 50 } },
  },
  {
    name: "Single Sign-On (SSO)",
    availability: { Starter: "NOT_AVAILABLE", Growth: "ADDON", Enterprise: "INCLUDED" },
    addonPricing: { Growth: { model: "FIXED_MONTHLY", value: 200 } },
  },
  {
    name: "Advanced anomaly detection",
    availability: { Starter: "NOT_AVAILABLE", Growth: "ADDON", Enterprise: "INCLUDED" },
    addonPricing: { Growth: { model: "PERCENT_OF_PRODUCT", value: 10 } },
  },
  {
    name: "Dedicated support",
    availability: { Starter: "NOT_AVAILABLE", Growth: "NOT_AVAILABLE", Enterprise: "INCLUDED" },
  },
  {
    name: "White-label option",
    availability: { Starter: "NOT_AVAILABLE", Growth: "ADDON", Enterprise: "ADDON" },
    addonPricing: {
      Growth: { model: "FIXED_MONTHLY", value: 500 },
      Enterprise: { model: "FIXED_MONTHLY", value: 300 },
    },
  },
  {
    name: "Custom integrations",
    availability: { Starter: "NOT_AVAILABLE", Growth: "ADDON", Enterprise: "ADDON" },
    addonPricing: {
      Growth: { model: "FIXED_MONTHLY", value: 1000 },
      Enterprise: { model: "PERCENT_OF_PRODUCT", value: 5 },
    },
  },
];

async function main() {
  const existing = await prisma.product.findFirst({ where: { name: PRODUCT_NAME } });
  if (existing) {
    console.log(`"${PRODUCT_NAME}" already exists (id ${existing.id}) -- skipping seed.`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: { name: PRODUCT_NAME } });

    const tiersByName = new Map<string, string>();
    for (const tier of TIERS) {
      const created = await tx.tier.create({
        data: {
          productId: product.id,
          name: tier.name,
          order: tier.order,
          basePricePerSeat: tier.basePricePerSeat,
        },
      });
      tiersByName.set(tier.name, created.id);
    }

    for (const featureDef of FEATURES) {
      const feature = await tx.feature.create({
        data: { productId: product.id, name: featureDef.name },
      });

      for (const tier of TIERS) {
        const tierId = tiersByName.get(tier.name)!;
        const availability = featureDef.availability[tier.name];

        const row = await tx.featureTierAvailability.create({
          data: { featureId: feature.id, tierId, availability },
        });

        const pricing = featureDef.addonPricing?.[tier.name];
        if (availability === "ADDON" && pricing) {
          await tx.addonPricing.create({
            data: {
              featureTierAvailabilityId: row.id,
              pricingModel: pricing.model,
              pricingValue: pricing.value,
            },
          });
        }
      }
    }

    console.log(`Seeded "${product.name}" with ${TIERS.length} tiers and ${FEATURES.length} features.`);
  }, { timeout: 30000 });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
