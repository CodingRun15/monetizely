"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createQuote } from "@/app/actions/quote-actions";
import { calculateQuote } from "@/lib/pricing";
import { TERM_DISCOUNT, TERM_LABEL, type AddonPricingModel, type TermLength } from "@/lib/pricing.types";
import { formatCurrency } from "@/lib/format";

export interface ProductOption {
  id: string;
  name: string;
  tiers: {
    id: string;
    name: string;
    basePricePerSeat: number;
    addons: {
      featureId: string;
      featureName: string;
      pricingModel: AddonPricingModel;
      pricingValue: number;
    }[];
  }[];
}

interface AddonSelectionState {
  checked: boolean;
  seats: string;
}

function addonHint(model: AddonPricingModel, value: number): string {
  switch (model) {
    case "FIXED_MONTHLY":
      return `${formatCurrency(value)}/month flat`;
    case "PER_SEAT":
      return `${formatCurrency(value)}/seat/month`;
    case "PERCENT_OF_PRODUCT":
      return `${value}% of product cost`;
  }
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "issues" in err && Array.isArray((err as { issues: unknown }).issues)) {
    return (err as { issues: { message: string }[] }).issues.map((i) => i.message).join(", ");
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

export function QuoteForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [tierId, setTierId] = useState(products[0]?.tiers[0]?.id ?? "");
  const [seats, setSeats] = useState(1);
  const [termLength, setTermLength] = useState<TermLength>("MONTHLY");
  const [overallDiscountPercent, setOverallDiscountPercent] = useState(0);
  const [addonSelections, setAddonSelections] = useState<Record<string, AddonSelectionState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);
  const tiers = selectedProduct?.tiers ?? [];
  const selectedTier = tiers.find((t) => t.id === tierId);
  const addonOptions = selectedTier?.addons ?? [];

  function handleProductChange(newProductId: string) {
    const product = products.find((p) => p.id === newProductId);
    setProductId(newProductId);
    setTierId(product?.tiers[0]?.id ?? "");
    setAddonSelections({});
  }

  function handleTierChange(newTierId: string) {
    setTierId(newTierId);
    setAddonSelections({});
  }

  function toggleAddon(featureId: string, checked: boolean) {
    setAddonSelections((prev) => ({
      ...prev,
      [featureId]: { checked, seats: prev[featureId]?.seats ?? "" },
    }));
  }

  function setAddonSeats(featureId: string, seats: string) {
    setAddonSelections((prev) => ({
      ...prev,
      [featureId]: { checked: prev[featureId]?.checked ?? false, seats },
    }));
  }

  function buildAddonsPayload() {
    return Object.entries(addonSelections)
      .filter(([, v]) => v.checked)
      .map(([featureId, v]) => ({
        featureId,
        seats: v.seats.trim() === "" ? undefined : Number(v.seats),
      }));
  }

  const preview = useMemo(() => {
    if (!selectedProduct || !selectedTier || seats <= 0) {
      return { result: null, error: null };
    }
    try {
      const result = calculateQuote({
        productName: selectedProduct.name,
        tierName: selectedTier.name,
        basePricePerSeat: selectedTier.basePricePerSeat,
        seats,
        termLength,
        overallDiscountPercent,
        addons: buildAddonsPayload(),
        addonCatalog: addonOptions,
      });
      return { result, error: null };
    } catch (err) {
      return { result: null, error: errorMessage(err) };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, selectedTier, seats, termLength, overallDiscountPercent, addonSelections, addonOptions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { id } = await createQuote({
        name,
        customerName,
        productId,
        tierId,
        seats,
        termLength,
        overallDiscountPercent,
        addons: buildAddonsPayload(),
      });
      router.push(`/quotes/${id}`);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:w-1/2">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Quote name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Acme Corp - Q3 2026 proposal"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="customerName" className="text-sm font-medium">
            Customer
          </label>
          <input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="Acme Corporation"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="productId" className="text-sm font-medium">
            Product
          </label>
          <select
            id="productId"
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tierId" className="text-sm font-medium">
            Tier
          </label>
          <select
            id="tierId"
            value={tierId}
            onChange={(e) => handleTierChange(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({formatCurrency(t.basePricePerSeat)}/seat/mo)
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="seats" className="text-sm font-medium">
            Seats
          </label>
          <input
            id="seats"
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="termLength" className="text-sm font-medium">
            Term length
          </label>
          <select
            id="termLength"
            value={termLength}
            onChange={(e) => setTermLength(e.target.value as TermLength)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {(Object.keys(TERM_LABEL) as TermLength[]).map((term) => (
              <option key={term} value={term}>
                {TERM_LABEL[term]}
                {TERM_DISCOUNT[term] > 0 ? ` (${TERM_DISCOUNT[term] * 100}% discount)` : ""}
              </option>
            ))}
          </select>
        </div>

        {addonOptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Add-ons available on this tier</span>
            <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3">
              {addonOptions.map((addon) => {
                const selection = addonSelections[addon.featureId];
                return (
                  <div key={addon.featureId} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`addon-${addon.featureId}`}
                      checked={selection?.checked ?? false}
                      onChange={(e) => toggleAddon(addon.featureId, e.target.checked)}
                    />
                    <label htmlFor={`addon-${addon.featureId}`} className="flex-1 text-sm">
                      {addon.featureName}{" "}
                      <span className="text-zinc-500">— {addonHint(addon.pricingModel, addon.pricingValue)}</span>
                    </label>
                    {selection?.checked && addon.pricingModel === "PER_SEAT" && (
                      <input
                        type="number"
                        min={1}
                        placeholder="Seats"
                        value={selection.seats}
                        onChange={(e) => setAddonSeats(addon.featureId, e.target.value)}
                        className="w-24 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="overallDiscountPercent" className="text-sm font-medium">
            Overall discount (%, optional)
          </label>
          <input
            id="overallDiscountPercent"
            type="number"
            min={0}
            max={100}
            value={overallDiscountPercent}
            onChange={(e) => setOverallDiscountPercent(Number(e.target.value))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save quote"}
        </button>
      </form>

      <div className="flex-1 lg:w-1/2">
        <h2 className="mb-3 text-lg font-medium">Live preview</h2>
        {preview.error && <p className="text-sm text-amber-700">{preview.error}</p>}
        {!preview.error && !preview.result && (
          <p className="text-sm text-zinc-500">Fill in the form to see a price preview.</p>
        )}
        {preview.result && (
          <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-3 py-2 font-medium">Line item</th>
                  <th className="px-3 py-2 font-medium">How it was calculated</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {preview.result.lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-zinc-100 last:border-0">
                    <td className="px-3 py-2 font-medium">{item.label}</td>
                    <td className="px-3 py-2 text-zinc-500">{item.description}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200 bg-zinc-50 font-semibold">
                  <td className="px-3 py-2" colSpan={2}>
                    Total
                  </td>
                  <td className="px-3 py-2 text-right">{formatCurrency(preview.result.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
