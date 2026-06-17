"use client";

import { useState } from "react";
import { updateFeatureAvailability } from "@/app/actions/catalog-actions";

type Availability = "INCLUDED" | "ADDON" | "NOT_AVAILABLE";
type PricingModel = "FIXED_MONTHLY" | "PER_SEAT" | "PERCENT_OF_PRODUCT";

export function AvailabilityRow({
  productId,
  featureId,
  tier,
  initialAvailability,
  initialPricingModel,
  initialPricingValue,
}: {
  productId: string;
  featureId: string;
  tier: { id: string; name: string };
  initialAvailability: Availability;
  initialPricingModel: PricingModel | null;
  initialPricingValue: number | null;
}) {
  const [availability, setAvailability] = useState<Availability>(initialAvailability);

  return (
    <form
      action={updateFeatureAvailability}
      className="grid grid-cols-[8rem_10rem_1fr_1fr_auto] items-center gap-3 border-b border-zinc-100 py-3 last:border-0"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="featureId" value={featureId} />
      <input type="hidden" name="tierId" value={tier.id} />

      <span className="font-medium">{tier.name}</span>

      <select
        name="availability"
        value={availability}
        onChange={(e) => setAvailability(e.target.value as Availability)}
        className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
      >
        <option value="NOT_AVAILABLE">Not available</option>
        <option value="ADDON">Add-on</option>
        <option value="INCLUDED">Included</option>
      </select>

      {availability === "ADDON" ? (
        <select
          name="pricingModel"
          defaultValue={initialPricingModel ?? "FIXED_MONTHLY"}
          className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        >
          <option value="FIXED_MONTHLY">Fixed monthly price</option>
          <option value="PER_SEAT">Per-seat price</option>
          <option value="PERCENT_OF_PRODUCT">% of product cost</option>
        </select>
      ) : (
        <span />
      )}

      {availability === "ADDON" ? (
        <input
          name="pricingValue"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initialPricingValue ?? ""}
          placeholder="Value"
          className="w-28 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      ) : (
        <span />
      )}

      <button
        type="submit"
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100"
      >
        Save
      </button>
    </form>
  );
}
