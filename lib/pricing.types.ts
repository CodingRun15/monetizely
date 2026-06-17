export type TermLength = "MONTHLY" | "ANNUAL" | "TWO_YEAR";
export type AddonPricingModel = "FIXED_MONTHLY" | "PER_SEAT" | "PERCENT_OF_PRODUCT";

export const TERM_MONTHS: Record<TermLength, number> = {
  MONTHLY: 1,
  ANNUAL: 12,
  TWO_YEAR: 24,
};

export const TERM_DISCOUNT: Record<TermLength, number> = {
  MONTHLY: 0,
  ANNUAL: 0.15,
  TWO_YEAR: 0.25,
};

export const TERM_LABEL: Record<TermLength, string> = {
  MONTHLY: "Monthly",
  ANNUAL: "Annual",
  TWO_YEAR: "Two-year",
};

export interface AddonCatalogInfo {
  featureId: string;
  featureName: string;
  pricingModel: AddonPricingModel;
  /** Dollars for FIXED_MONTHLY/PER_SEAT, percent-as-number (e.g. 10 = 10%) for PERCENT_OF_PRODUCT. */
  pricingValue: number;
}

export interface AddonSelectionInput {
  featureId: string;
  /** Required, and only meaningful, when the addon's pricingModel is PER_SEAT. */
  seats?: number;
}

export interface PricingInput {
  productName: string;
  tierName: string;
  basePricePerSeat: number;
  seats: number;
  termLength: TermLength;
  overallDiscountPercent: number;
  addons: AddonSelectionInput[];
  addonCatalog: AddonCatalogInfo[];
}

export interface LineItem {
  label: string;
  description: string;
  notes: string;
  amount: number;
}

export interface PricingResult {
  lineItems: LineItem[];
  subtotal: number;
  overallDiscountAmount: number;
  total: number;
}
