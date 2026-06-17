import {
  AddonSelectionInput,
  PricingInput,
  PricingResult,
  LineItem,
  TERM_MONTHS,
  TERM_DISCOUNT,
} from "./pricing.types";

export function roundCurrency(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function formatMoney(n: number): string {
  const rounded = roundCurrency(n);
  return Number.isInteger(rounded) ? `$${rounded}` : `$${rounded.toFixed(2)}`;
}

function formatPercent(n: number): string {
  return Number.isInteger(n) ? `${n}%` : `${n.toFixed(2)}%`;
}

function pluralize(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

export function calculateQuote(input: PricingInput): PricingResult {
  const {
    productName,
    tierName,
    basePricePerSeat,
    seats,
    termLength,
    overallDiscountPercent,
    addons,
    addonCatalog,
  } = input;

  if (seats <= 0) {
    throw new Error("seats must be greater than 0");
  }

  const months = TERM_MONTHS[termLength];
  const termDiscount = TERM_DISCOUNT[termLength];
  const baseAmount = roundCurrency(seats * basePricePerSeat * months * (1 - termDiscount));

  const discountClause =
    termDiscount > 0
      ? ` × (1 - ${formatPercent(termDiscount * 100)} ${termLength === "ANNUAL" ? "annual" : "two-year"} discount)`
      : "";

  const lineItems: LineItem[] = [
    {
      label: `${productName} - ${tierName} tier`,
      description: `${pluralize(seats, "seat")} × ${formatMoney(basePricePerSeat)} per seat per month × ${pluralize(months, "month")}${discountClause}`,
      notes: "Base product cost",
      amount: baseAmount,
    },
  ];

  for (const selection of addons) {
    lineItems.push(buildAddonLineItem(selection, addonCatalog, months, baseAmount));
  }

  const subtotal = roundCurrency(lineItems.reduce((sum, item) => sum + item.amount, 0));

  let overallDiscountAmount = 0;
  if (overallDiscountPercent > 0) {
    overallDiscountAmount = roundCurrency(-(subtotal * (overallDiscountPercent / 100)));
    lineItems.push({
      label: "Overall discount",
      description: `${formatPercent(overallDiscountPercent)} of subtotal (${formatMoney(subtotal)})`,
      notes: "Discount applied to the whole quote",
      amount: overallDiscountAmount,
    });
  }

  const total = roundCurrency(subtotal + overallDiscountAmount);

  return { lineItems, subtotal, overallDiscountAmount, total };
}

function buildAddonLineItem(
  selection: AddonSelectionInput,
  addonCatalog: PricingInput["addonCatalog"],
  months: number,
  baseAmount: number,
): LineItem {
  const catalogEntry = addonCatalog.find((a) => a.featureId === selection.featureId);
  if (!catalogEntry) {
    throw new Error(`No add-on pricing found for feature ${selection.featureId}`);
  }

  switch (catalogEntry.pricingModel) {
    case "FIXED_MONTHLY":
      return {
        label: `Add-on: ${catalogEntry.featureName}`,
        description: `${formatMoney(catalogEntry.pricingValue)} per month × ${pluralize(months, "month")}`,
        notes: "Fixed monthly add-on price",
        amount: roundCurrency(catalogEntry.pricingValue * months),
      };

    case "PER_SEAT": {
      if (selection.seats == null || selection.seats <= 0) {
        throw new Error(`Add-on "${catalogEntry.featureName}" requires a seat count`);
      }
      return {
        label: `Add-on: ${catalogEntry.featureName}`,
        description: `${pluralize(selection.seats, "seat")} × ${formatMoney(catalogEntry.pricingValue)} per seat per month × ${pluralize(months, "month")}`,
        notes: "Per-seat add-on. Seat count is independent of the product's own seat count.",
        amount: roundCurrency(selection.seats * catalogEntry.pricingValue * months),
      };
    }

    case "PERCENT_OF_PRODUCT":
      return {
        label: `Add-on: ${catalogEntry.featureName}`,
        description: `${formatPercent(catalogEntry.pricingValue)} of product cost (${formatMoney(baseAmount)})`,
        notes: "Percentage of the base product cost (after the term-length discount).",
        amount: roundCurrency(baseAmount * (catalogEntry.pricingValue / 100)),
      };

    default: {
      const exhaustiveCheck: never = catalogEntry.pricingModel;
      throw new Error(`Unknown pricing model: ${exhaustiveCheck}`);
    }
  }
}
