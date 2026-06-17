import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/lib/pricing";
import type { AddonCatalogInfo, PricingInput } from "@/lib/pricing.types";

function basePricingInput(overrides: Partial<PricingInput> = {}): PricingInput {
  return {
    productName: "Analytics Suite",
    tierName: "Growth",
    basePricePerSeat: 50,
    seats: 25,
    termLength: "MONTHLY",
    overallDiscountPercent: 0,
    addons: [],
    addonCatalog: [],
    ...overrides,
  };
}

describe("calculateQuote - base product line", () => {
  it("applies no discount for a monthly term", () => {
    const result = calculateQuote(basePricingInput({ termLength: "MONTHLY" }));
    expect(result.lineItems[0].amount).toBe(25 * 50 * 1);
    expect(result.total).toBe(1250);
  });

  it("replicates the sample-quote.xlsx base line for an annual term (15% discount)", () => {
    const result = calculateQuote(basePricingInput({ termLength: "ANNUAL" }));
    expect(result.lineItems[0].amount).toBe(12750);
  });

  it("applies a 25% discount for a two-year term", () => {
    const result = calculateQuote(basePricingInput({ termLength: "TWO_YEAR" }));
    // 25 seats * 50 * 24 months * (1 - 0.25) = 22500
    expect(result.lineItems[0].amount).toBe(22500);
  });
});

describe("calculateQuote - add-ons", () => {
  it("computes a fixed-monthly add-on (SSO from the sample quote)", () => {
    const addonCatalog: AddonCatalogInfo[] = [
      { featureId: "sso", featureName: "Single Sign-On (SSO)", pricingModel: "FIXED_MONTHLY", pricingValue: 200 },
    ];
    const result = calculateQuote(
      basePricingInput({ termLength: "ANNUAL", addons: [{ featureId: "sso" }], addonCatalog }),
    );
    const addonLine = result.lineItems.find((li) => li.label.includes("SSO"));
    expect(addonLine?.amount).toBe(2400);
  });

  it("computes a per-seat add-on with a seat count independent of the product's seats (API access from the sample quote)", () => {
    const addonCatalog: AddonCatalogInfo[] = [
      { featureId: "api", featureName: "API access", pricingModel: "PER_SEAT", pricingValue: 50 },
    ];
    const result = calculateQuote(
      basePricingInput({
        termLength: "ANNUAL",
        seats: 25,
        addons: [{ featureId: "api", seats: 5 }],
        addonCatalog,
      }),
    );
    const addonLine = result.lineItems.find((li) => li.label.includes("API access"));
    expect(addonLine?.amount).toBe(3000);
    // Product seats (25) must not have leaked into the add-on calculation (5 seats).
    expect(addonLine?.description).toContain("5 seats");
  });

  it("computes a percent-of-product add-on off the already-discounted base line", () => {
    const addonCatalog: AddonCatalogInfo[] = [
      {
        featureId: "anomaly",
        featureName: "Advanced anomaly detection",
        pricingModel: "PERCENT_OF_PRODUCT",
        pricingValue: 10,
      },
    ];
    const result = calculateQuote(
      basePricingInput({ termLength: "ANNUAL", addons: [{ featureId: "anomaly" }], addonCatalog }),
    );
    // Base line is 12750 (after the 15% annual discount); 10% of that is 1275.
    const addonLine = result.lineItems.find((li) => li.label.includes("anomaly"));
    expect(addonLine?.amount).toBe(1275);
  });

  it("throws when a PER_SEAT add-on is selected without a seat count", () => {
    const addonCatalog: AddonCatalogInfo[] = [
      { featureId: "api", featureName: "API access", pricingModel: "PER_SEAT", pricingValue: 50 },
    ];
    expect(() =>
      calculateQuote(basePricingInput({ addons: [{ featureId: "api" }], addonCatalog })),
    ).toThrow();
  });
});

describe("calculateQuote - full sample-quote.xlsx replication", () => {
  it("matches the reference quote exactly: base + SSO + API access, annual term, total 18150", () => {
    const addonCatalog: AddonCatalogInfo[] = [
      { featureId: "sso", featureName: "Single Sign-On (SSO)", pricingModel: "FIXED_MONTHLY", pricingValue: 200 },
      { featureId: "api", featureName: "API access", pricingModel: "PER_SEAT", pricingValue: 50 },
    ];
    const result = calculateQuote(
      basePricingInput({
        termLength: "ANNUAL",
        seats: 25,
        addons: [{ featureId: "sso" }, { featureId: "api", seats: 5 }],
        addonCatalog,
      }),
    );

    expect(result.lineItems).toHaveLength(3);
    expect(result.lineItems[0].amount).toBe(12750);
    expect(result.lineItems[1].amount).toBe(2400);
    expect(result.lineItems[2].amount).toBe(3000);
    expect(result.subtotal).toBe(18150);
    expect(result.overallDiscountAmount).toBe(0);
    expect(result.total).toBe(18150);
  });
});

describe("calculateQuote - overall discount", () => {
  it("applies an overall discount percentage on top of the subtotal", () => {
    const addonCatalog: AddonCatalogInfo[] = [
      { featureId: "sso", featureName: "Single Sign-On (SSO)", pricingModel: "FIXED_MONTHLY", pricingValue: 200 },
      { featureId: "api", featureName: "API access", pricingModel: "PER_SEAT", pricingValue: 50 },
    ];
    const result = calculateQuote(
      basePricingInput({
        termLength: "ANNUAL",
        seats: 25,
        overallDiscountPercent: 10,
        addons: [{ featureId: "sso" }, { featureId: "api", seats: 5 }],
        addonCatalog,
      }),
    );

    expect(result.subtotal).toBe(18150);
    expect(result.overallDiscountAmount).toBe(-1815);
    expect(result.total).toBe(16335);
    expect(result.lineItems.at(-1)?.label).toBe("Overall discount");
  });

  it("produces no discount line item when overallDiscountPercent is 0", () => {
    const result = calculateQuote(basePricingInput({ overallDiscountPercent: 0 }));
    expect(result.lineItems.some((li) => li.label === "Overall discount")).toBe(false);
    expect(result.overallDiscountAmount).toBe(0);
  });
});

describe("calculateQuote - multiple add-ons combined", () => {
  it("sums all three pricing models correctly in one quote", () => {
    const addonCatalog: AddonCatalogInfo[] = [
      { featureId: "fixed", featureName: "White-label option", pricingModel: "FIXED_MONTHLY", pricingValue: 500 },
      { featureId: "perseat", featureName: "API access", pricingModel: "PER_SEAT", pricingValue: 50 },
      {
        featureId: "percent",
        featureName: "Custom integrations",
        pricingModel: "PERCENT_OF_PRODUCT",
        pricingValue: 5,
      },
    ];
    const result = calculateQuote(
      basePricingInput({
        termLength: "ANNUAL",
        seats: 25,
        addons: [{ featureId: "fixed" }, { featureId: "perseat", seats: 5 }, { featureId: "percent" }],
        addonCatalog,
      }),
    );

    // base 12750 + fixed (500*12=6000) + per-seat (5*50*12=3000) + percent (5% of 12750=637.5)
    expect(result.lineItems).toHaveLength(4);
    expect(result.subtotal).toBe(12750 + 6000 + 3000 + 637.5);
  });
});

describe("calculateQuote - rounding", () => {
  it("rounds fractional cents to 2 decimal places", () => {
    const addonCatalog: AddonCatalogInfo[] = [
      { featureId: "odd", featureName: "Odd Percent Addon", pricingModel: "PERCENT_OF_PRODUCT", pricingValue: 33.333 },
    ];
    const result = calculateQuote(
      basePricingInput({ termLength: "MONTHLY", seats: 1, basePricePerSeat: 10, addons: [{ featureId: "odd" }], addonCatalog }),
    );
    const addonLine = result.lineItems.find((li) => li.label.includes("Odd"));
    // 10 * 0.33333 = 3.3333 -> rounds to 3.33
    expect(addonLine?.amount).toBe(3.33);
  });
});
