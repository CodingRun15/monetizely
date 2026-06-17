import { test, expect } from "@playwright/test";

test("create a catalog entry, build a quote, and view the saved quote", async ({ page }) => {
  const suffix = Date.now();
  const productName = `Test Product ${suffix}`;
  const tierName = "Pro";
  const featureName = "Priority Support";

  // 1. Create a product.
  await page.goto("/catalog/products/new");
  await page.getByLabel("Product name").fill(productName);
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page).toHaveURL(/\/catalog\/products\/(?!new$)[^/]+$/);
  const productUrl = page.url();

  // 2. Create a tier on that product.
  await page.goto(`${productUrl}/tiers/new`);
  await page.getByLabel("Tier name").fill(tierName);
  await page.getByLabel("Display order").fill("0");
  await page.getByLabel("Base price (USD per seat per month)").fill("40");
  await page.getByRole("button", { name: "Create tier" }).click();
  await expect(page).toHaveURL(productUrl);

  // 3. Create a feature and mark it as a fixed-monthly add-on on the Pro tier.
  await page.goto(`${productUrl}/features/new`);
  await page.getByLabel("Feature name").fill(featureName);
  await page.getByRole("button", { name: "Create feature" }).click();
  await expect(page).toHaveURL(productUrl);

  await page.getByRole("link", { name: featureName }).click();
  await expect(page).toHaveURL(/\/features\/[^/]+\/edit$/);

  const tierRow = page.locator("form").filter({ hasText: tierName });
  await tierRow.getByRole("combobox").first().selectOption("ADDON");
  await tierRow.getByRole("combobox").nth(1).selectOption("FIXED_MONTHLY");
  await tierRow.getByPlaceholder("Value").fill("100");
  await tierRow.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(productUrl);

  // 4. Build a quote against the new catalog entry.
  await page.goto("/quotes/new");
  await page.getByLabel("Quote name").fill("E2E Test Quote");
  await page.getByLabel("Customer").fill("Test Customer");
  await page.getByLabel("Product").selectOption({ label: productName });
  await page.getByLabel("Tier").selectOption({ label: `${tierName} ($40.00/seat/mo)` });
  await page.getByLabel("Seats").fill("10");
  // Term length left at its default (Monthly).
  await page.getByLabel(featureName, { exact: false }).check();

  await Promise.all([
    page.waitForURL(/\/quotes\/(?!new$)[^/]+$/),
    page.getByRole("button", { name: /Save quote/ }).click(),
  ]);

  // 5 & 6. Assert the saved quote view shows the correct line items and total.
  await expect(page.getByText(`${productName} - ${tierName} tier`)).toBeVisible();
  await expect(page.getByText("10 seats × $40 per seat per month × 1 month")).toBeVisible();
  await expect(page.getByText(`Add-on: ${featureName}`)).toBeVisible();
  await expect(page.getByText("$100 per month × 1 month")).toBeVisible();

  const row = page.locator("tr", { hasText: `${productName} - ${tierName} tier` });
  await expect(row.getByText("$400.00")).toBeVisible();

  const addonRow = page.locator("tr", { hasText: `Add-on: ${featureName}` });
  await expect(addonRow.getByText("$100.00")).toBeVisible();

  await expect(page.getByText("TOTAL")).toBeVisible();
  await expect(page.getByText("$500.00")).toBeVisible();
});
