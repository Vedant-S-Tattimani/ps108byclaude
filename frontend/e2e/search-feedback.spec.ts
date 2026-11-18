import { expect, test } from "@playwright/test";

// Regression: in single-column layouts results render below the notesheet, so a search
// looked like "nothing happened". The page must bring results into view, and the button
// must never fail silently.
test.describe("Find standards always gives visible feedback", () => {
  test.use({ viewport: { width: 742, height: 800 } });

  const findButton = (page: import("@playwright/test").Page) => page.getByRole("button", { name: /^(Find standards|Analysing…) Ctrl/ });

  test("results scroll into view on a narrow screen", async ({ page }) => {
    await page.goto("/");
    await page.locator("#search").scrollIntoViewIfNeeded();
    await page.getByLabel("Product description, technical spec or tender text").fill("LED street lights 90W for municipal roads");
    await findButton(page).click();
    const top = page.locator(".rec").first();
    await expect(top.locator(".designation")).toHaveText("IS 10322 (Part 5/Sec 3):2012");
    await expect(page.locator("#results")).toBeInViewport();
    await expect(top).toBeInViewport();
  });

  test("an empty search explains itself and focuses the box", async ({ page }) => {
    await page.goto("/");
    await page.locator("#search").scrollIntoViewIfNeeded();
    await findButton(page).click();
    await expect(page.getByRole("alert")).toHaveText("Type what you are buying first, or pick an example below.");
    await expect(page.locator("#query")).toBeFocused();
    await expect(page.locator("#query")).toHaveAttribute("aria-invalid", "true");
    await page.locator("#query").fill("cement");
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("dock and hero buttons take you to the search box", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Find standards" }).click();
    await expect(page.locator("#query")).toBeFocused();
    await expect(page.locator("#query")).toBeInViewport();

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator("#query").blur();
    await page.locator(".hero .btn-sticker").click();
    await expect(page.locator("#query")).toBeFocused();
    await expect(page.locator("#query")).toBeInViewport();
  });
});
