import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function search(page: Page, text: string) {
  await page.getByLabel("Product description, technical spec or tender text").fill(text);
  await page.getByRole("button", { name: /^Find standards Ctrl/ }).click();
  await expect(page.locator(".rec").first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/#recommend");
  await page.evaluate(() => window.localStorage.clear());
});

test("spec completeness checklist shows stated and missing key parameters", async ({ page }) => {
  await search(page, "LED street light 90W for municipal roads, 120 nos");
  const checklist = page.getByTestId("spec-checklist");
  await expect(checklist).toContainText("Wattage");
  await expect(checklist.locator("li.on")).toContainText(["Wattage"]);
  await expect(checklist.locator("li.off").first()).toContainText("not stated");
  await expect(page.locator("pre.clause")).toContainText("Key parameters (to be stated by the buyer)");
});

test("bidder compliance sheet downloads as CSV", async ({ page }) => {
  await search(page, "1.1 kV XLPE armoured aluminium power cable");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Compliance sheet" }).click()]);
  expect(download.suggestedFilename()).toBe("bidder-compliance-sheet.csv");
  const csv = await readFile(await download.path(), "utf-8");
  expect(csv).toContain("Bidder response (Complied / Not complied)");
  expect(csv).toContain("IS 7098 (Part 1):1988");
  expect(csv).toContain("ISI certification");
});

test("officer feedback is accepted", async ({ page }) => {
  await search(page, "OPC 53 grade cement");
  await page.getByRole("button", { name: "Yes, is-269 is right" }).click();
  await expect(page.getByText("thanks, noted for tuning")).toBeVisible();
});

test("watching a standard surfaces it in the revision feed", async ({ page }) => {
  await search(page, "modular switches for office");
  await page.locator(".rec").first().click();
  const drawer = page.getByRole("dialog", { name: "Standard details" });
  await expect(drawer.getByRole("link", { name: "Open on BIS" })).toHaveAttribute("href", /bis\.gov\.in/);
  await drawer.getByRole("button", { name: "Watch for changes" }).click();
  await expect(drawer.getByRole("button", { name: "Watching" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Standards library" }).click();
  const updates = page.getByTestId("updates-panel");
  await updates.getByRole("button", { name: /My watchlist \(1\)/ }).click();
  await expect(updates).toContainText("IS 3854:2023");
  await expect(updates).toContainText("★ watching");
  await expect(updates).toContainText("Revised (replaces IS 3854:1997)");
});

test("certificate number checker recognises formats and links to official verification", async ({ page }) => {
  await page.goto("/#audit");
  const checker = page.getByTestId("certificate-checker");
  await checker.getByLabel("Certificate number").fill("CM/L-7600012345");
  await checker.getByRole("button", { name: "Check" }).click();
  await expect(checker).toContainText("ISI licence (CM/L)");
  await expect(checker.getByText("Format OK")).toBeVisible();
  await expect(checker.getByRole("link", { name: /BIS Care app/ })).toHaveAttribute("href", /bis\.gov\.in/);
  await checker.getByLabel("Certificate number").fill("XYZ");
  await checker.getByRole("button", { name: "Check" }).click();
  await expect(checker.getByText("Check again")).toBeVisible();
});

test("Hindi interface toggle translates the app chrome", async ({ page }) => {
  await page.getByRole("button", { name: "हिं" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page.getByLabel("उत्पाद विवरण, तकनीकी विनिर्देश या निविदा पाठ")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "विनिर्देश जाँच" })).toBeVisible();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByLabel("Product description, technical spec or tender text")).toBeVisible();
});

test("drop-in widget works on a sample portal form", async ({ page }) => {
  await page.goto("/widget-demo");
  await page.getByRole("button", { name: "Suggest Indian Standards" }).click();
  await expect(page.getByText(/IS 10322 \(Part 5\/Sec 3\):2012 · \d+% match/)).toBeVisible();
  await expect(page.getByText("CRS mandatory").first()).toBeVisible();
  await page.getByRole("button", { name: "Insert clause" }).click();
  await expect(page.locator("#spec")).toHaveValue(/TECHNICAL SPECIFICATION/);
});
