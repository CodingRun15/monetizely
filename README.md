# Monetizely Quoting Tool

A small internal tool for a pricing consultant: set up a client's product catalog (products,
tiers, features, add-on pricing), then build a shareable quote against it.

- **Live app:** https://monetizely-seven.vercel.app
- **Repo:** https://github.com/CodingRun15/monetizely

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), TypeScript | Required by the brief. Server components for data-fetching pages, server actions for mutations — no separate API layer needed. |
| Database | Postgres (Neon) | Required to pick Postgres/SQLite/MongoDB; Neon deploys cleanly on Vercel (serverless-friendly, free tier) and SQLite doesn't persist on Vercel's ephemeral filesystem. |
| ORM | Prisma 7 | Type-safe schema → TS pipeline. Note: Prisma 7 removed the old "magic" engine that read `DATABASE_URL` implicitly — the client now requires an explicit driver adapter (see below). |
| DB driver adapter | `@prisma/adapter-pg` + `pg` | Plain Postgres wire-protocol driver. Works identically against any standard Postgres (local or Neon), so there's one code path for dev and prod rather than branching on a Neon-specific HTTP driver. |
| Unit tests | Vitest | Fast, ESM/TS-native, ideal for testing the pure pricing module in isolation. |
| E2E tests | Playwright | Drives a real browser through the catalog → quote → view flow. |
| Styling | Tailwind CSS | The brief explicitly deprioritizes visual polish; Tailwind is the fastest way to a clean, legible CRUD UI. |
| Validation | Zod | Validates all server action inputs before they reach Prisma. |

## Running locally

1. **Get a Postgres database.** The free tier at [neon.tech](https://neon.tech) works well; a
   local Postgres instance works too.
2. **Configure environment variables.** Copy `.env.example` to `.env` and fill in `DATABASE_URL`
   (and `DIRECT_URL`, which can be identical to `DATABASE_URL` unless you're using Neon's pooled
   endpoint).
3. **Install dependencies and set up the database:**
   ```bash
   npm install
   npx prisma migrate dev
   npm run db:seed   # optional: loads the "Analytics Suite" example catalog from catalog-example.xlsx
   ```
4. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Running tests

```bash
npm run test       # unit tests (pricing engine) — Vitest
npm run test:e2e   # end-to-end test — Playwright (requires the dev server's DB to be migrated)
```

The first time you run the e2e suite you'll also need `npx playwright install chromium`.

## Data model

- **Product → Tier**: a product has multiple tiers, each with its own base price (USD/seat/month).
- **Product → Feature**: a product has a flat list of features.
- **FeatureTierAvailability**: one row per `(feature, tier)` pair — the "matrix cell" — holding
  whether that feature is `INCLUDED`, an `ADDON`, or `NOT_AVAILABLE` on that tier.
- **AddonPricing**: a 1:1 child of a `FeatureTierAvailability` row, present only while that cell is
  `ADDON`. Holds the pricing model (`FIXED_MONTHLY` / `PER_SEAT` / `PERCENT_OF_PRODUCT`) and value.
  Splitting this out (rather than inlining pricing fields on the matrix row) keeps "is this feature
  available here" separate from "how is it priced here," and means a feature can be priced
  differently per tier without any awkward nullable-field overloading.
- **Quote**: references one product + tier, a seat count, a term length, an optional overall
  discount, and the computed `subtotal` / `overallDiscountAmount` / `total`.
- **QuoteLineItem**: one row per line item on a quote (base product line, then one row per
  selected add-on, then an optional overall-discount row), written once at quote-creation time and
  never updated. Quotes are immutable, but the catalog isn't — storing the computed line items
  relationally (rather than recomputing from current catalog state on every view) guarantees a
  quote's shareable URL keeps showing exactly what was true when it was created, even if the
  underlying catalog prices change later.
- **QuoteAddonSelection**: which add-ons were selected on a quote, and (for `PER_SEAT` add-ons) how
  many seats were configured for that add-on specifically — independent of the product's own seat
  count (see `sample-quote.xlsx`, where the product has 25 seats but its API-access add-on is
  configured for only 5).

The pricing math itself lives in `lib/pricing.ts` as a pure function (`calculateQuote`) with no
database or framework dependencies, so it's fully unit-testable in isolation and can also run
client-side for the quote builder's live price preview.

## Assumptions

- **The term-length discount (Monthly 0% / Annual 15% / Two-year 25%) applies only to the base
  product's per-seat price, never to add-ons.** Verified against `sample-quote.xlsx`: its
  per-seat "API access" add-on shows no discount even though the quote's term is Annual.
- **`PERCENT_OF_PRODUCT` add-ons compute their percentage against the already term-discounted base
  product line amount**, not the raw undiscounted seats × price × months. The brief doesn't give a
  worked example of this case, so this was the most defensible reading of "percentage of the
  product cost" given the discount is meant to apply to "the product."
- **Catalog editing is scoped to tier base price and feature × tier availability/pricing only.**
  Products, tiers, and features can't be renamed or deleted once created — only their
  price/availability can change. This satisfies the brief's "create + edit catalog is fine, no
  delete" while avoiding the complexity of cascading renames.
- **Quotes have no list/dashboard view.** The brief only asks for "create a quote" and "view a
  saved quote via its URL" — there's no requirement to browse all past quotes, so no such page
  was built.

## Decisions

- **Server actions instead of a REST/API-route layer.** Every mutation (create product, create
  quote, etc.) is a `"use server"` function called either as a native `<form action>` (catalog
  forms — works without client JS) or directly from a client component (the quote builder, which
  needs client-side state anyway for the live price preview and dynamic add-on fields).
- **Driver adapter (`@prisma/adapter-pg`) used identically in dev and prod.** Neon also offers an
  HTTP-based serverless driver (`@prisma/adapter-neon`) that avoids TCP connection overhead on
  Vercel's serverless functions, but it only works against Neon specifically. Using the plain
  Postgres adapter everywhere keeps one code path and is simple enough for this exercise's traffic
  level; switching to the Neon adapter in production is a one-line change if needed later.
- **Quote line items stored as relational rows (`QuoteLineItem`), not a JSON blob column.** Slightly
  more write complexity (an extra `createMany` per quote) in exchange for a fully normalized,
  queryable schema.
- **Add-on pricing normalized into its own `AddonPricing` table** rather than inlined as nullable
  columns on the availability matrix row, for the same reason.
- **One combined page per feature (`features/[id]/edit`)** to set that feature's availability and
  pricing across *all* tiers at once, rather than one page per individual matrix cell — fewer
  clicks to configure a feature across a product's tiers.

## Questions I would have asked

- Should the term-length discount ever apply to per-seat add-ons, or is "never" always correct?
- Should products, tiers, or features be renamable after creation, or is "create-only" for names
  the right scope?
- Is there an intended cap on the overall discount percentage (the UI currently allows 0–100%)?
- The sample quote includes a "valid until" date — is that something the tool should generate and
  store, or out of scope for this exercise?

## What I'd build next

- A quotes list/dashboard page (browse all past quotes, not just direct-by-URL).
- CSV/Excel import of a catalog, so a real client spreadsheet could be loaded instead of
  hand-entered through the UI.
- PDF export of a quote.
- A separate database branch/instance for e2e tests rather than running them against the same dev
  database.
- Switch to Neon's HTTP driver adapter in production for lower serverless cold-start latency.
