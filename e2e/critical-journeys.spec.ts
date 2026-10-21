import { expect, test, type Page } from "@playwright/test";

async function addProductAndOpenCheckout(page: Page) {
  await page.goto("/");
  await page.locator('button[aria-label^="Add "][aria-label$=" to cart"]').first().click();
  await page.goto("/checkout");
  await page.getByRole("textbox", { name: "Email" }).fill("customer@shopsphere.demo");
  await page.getByRole("textbox", { name: "Password" }).fill("shop123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
}

async function completeCheckoutToPayment(page: Page) {
  await page.getByRole("textbox", { name: "Full name" }).fill("Demo Customer");
  await page.getByRole("textbox", { name: "Email" }).fill("customer@shopsphere.demo");
  await page.getByRole("textbox", { name: "Phone" }).fill("9876543210");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Demo Customer");
  await page.getByRole("textbox", { name: "Address line" }).fill("1 Demo Street");
  await page.getByRole("textbox", { name: "City" }).fill("Pune");
  await page.getByRole("textbox", { name: "State" }).fill("Maharashtra");
  await page.getByRole("textbox", { name: "Postal code" }).fill("411001");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Standard delivery/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Review your order" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Mock card" }).click();
}

test("catalogue exposes search, sorting, cart, assistant, and product details", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("textbox", { name: "Search products" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Sort products" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open shopping assistant/i })).toBeVisible();
  await expect(page.locator('a[href^="/products/"]').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('a[href^="/products/"]').first().click();
  await expect(page.getByRole("button", { name: /Add to cart/i }).first()).toBeVisible();
});

test("keeps product cards aligned across responsive catalogue grids", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("article.group").first()).toBeVisible({ timeout: 15_000 });

  for (const [width, columns] of [[1440, 4], [768, 3], [390, 2]] as const) {
    await page.setViewportSize({ width, height: 900 });
    const cards = page.locator("article.group");
    const measurements = await cards.evaluateAll((items, expectedColumns) => {
      const firstRow = items.slice(0, expectedColumns);
      return {
        widths: firstRow.map((item) => Math.round(item.getBoundingClientRect().width)),
        heights: firstRow.map((item) => Math.round(item.getBoundingClientRect().height)),
      };
    }, columns);
    expect(new Set(measurements.widths).size).toBe(1);
    expect(new Set(measurements.heights).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
});

test("keeps catalogue pagination selected and changes products", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("article.group").first()).toBeVisible({ timeout: 15_000 });
  const firstPageProduct = await page.locator("article.group h2").first().textContent();

  await page.getByRole("button", { name: "2", exact: true }).click();
  await page.waitForTimeout(1_000);
  await expect(page.getByRole("button", { name: "2", exact: true })).toHaveClass(/bg-ink/);
  await expect(page).toHaveURL(/[?&]page=2/);
  expect(await page.locator("article.group h2").first().textContent()).not.toBe(firstPageProduct);

  await page.getByRole("button", { name: "3", exact: true }).click();
  await page.waitForTimeout(1_000);
  await expect(page.getByRole("button", { name: "3", exact: true })).toHaveClass(/bg-ink/);
  await expect(page).toHaveURL(/[?&]page=3/);

  await page.goBack();
  await expect(page).toHaveURL(/[?&]page=2/);
  await expect(page.getByRole("button", { name: "2", exact: true })).toHaveClass(/bg-ink/);
  await page.goForward();
  await expect(page).toHaveURL(/[?&]page=3/);
  await expect(page.getByRole("button", { name: "3", exact: true })).toHaveClass(/bg-ink/);
});

test("protected account route redirects to login and preserves destination", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("assistant opens with demo disclosure and starter prompts", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Open shopping assistant/i }).click();
  await expect(page.getByText("Rule-based demo, not a real LLM")).toBeVisible();
  await expect(page.getByRole("button", { name: "Headphones under 5000" })).toBeVisible();
});

test("completes checkout, creates one order, clears the cart, and preserves confirmation after refresh", async ({ page }) => {
  await addProductAndOpenCheckout(page);
  await completeCheckoutToPayment(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page.getByText("Order confirmed", { exact: true })).toBeVisible();
  const reference = await page.locator("strong").last().textContent();
  expect(reference).toMatch(/^SS-/);
  await page.reload();
  await expect(page.getByText("Order confirmed", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "View orders" }).click();
  await expect(page.getByText(reference!)).toBeVisible();
  await expect(page.getByText(/item\(s\)/).first()).toBeVisible();
  const storedOrders = await page.evaluate(() => JSON.parse(localStorage.getItem("shopsphere-orders") ?? "[]"));
  const storedCart = await page.evaluate(() => JSON.parse(localStorage.getItem("shopsphere-preferences") ?? "{\"cart\":[]}").cart ?? []);
  expect(storedOrders).toHaveLength(1);
  expect(storedCart).toHaveLength(0);
});

test("does not create an order on simulated payment failure, then retries successfully", async ({ page }) => {
  await addProductAndOpenCheckout(page);
  await completeCheckoutToPayment(page);
  await page.getByRole("button", { name: "Simulate payment failure" }).click();
  await expect(page.getByText("The simulated payment failed. No payment data was transmitted.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("shopsphere-orders") ?? "[]"))).toHaveLength(0);
  await page.getByRole("button", { name: "Retry" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page.getByText("Order confirmed", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("shopsphere-orders") ?? "[]"))).toHaveLength(1);
});

test("blocks invalid customer information before advancing checkout", async ({ page }) => {
  await addProductAndOpenCheckout(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Tell us about you" })).toBeVisible();
  expect(await page.locator("input:invalid").count()).toBeGreaterThan(0);
});

test("keeps mobile search usable and supports comparison", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "Search products mobile" });
  await expect(search).toBeVisible();
  expect((await search.boundingBox())?.width).toBeGreaterThan(300);
  await search.fill("mascara");
  await page.waitForTimeout(500);
  await expect(page.getByRole("listbox", { name: "Search suggestions" })).toBeVisible();
  await page.getByRole("button", { name: "Clear search mobile" }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Compare", exact: true }).nth(0).click();
  await page.getByRole("button", { name: "Compare", exact: true }).nth(0).click();
  await page.getByRole("button", { name: "Compare now" }).click();
  await expect(page.getByRole("dialog", { name: "Product comparison" })).toContainText("Compare 2 selected products");
});

test("protects admin route from customer sessions", async ({ page }) => {
  await page.goto("/login?next=%2Fadmin");
  await page.getByRole("textbox", { name: "Email" }).fill("customer@shopsphere.demo");
  await page.getByRole("textbox", { name: "Password" }).fill("shop123");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
