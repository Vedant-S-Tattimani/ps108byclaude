import { expect, test } from "@playwright/test";

test.describe("Landing page and navigation", () => {
  test("hero, brand and every landing section render", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SpecSetu/);
    await expect(page.getByRole("link", { name: /SpecSetu/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Indian");
    for (const heading of [/Tell us what/, /From one line of text/, /Real indents/, /Answers before/, /Write specs/]) {
      await expect(page.getByRole("heading", { name: heading })).toBeAttached();
    }
  });

  test("case file runs a live search and the dock shows the result count", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Run case: TMT saria/ }).click();
    await expect(page.locator(".rec").first().locator(".designation")).toHaveText("IS 1786:2008");
    await expect(page.locator(".dock-badge")).toHaveText(/^[1-5]$/);
  });

  test("how-it-works bars open and close", async ({ page }) => {
    await page.goto("/");
    const second = page.getByRole("button", { name: /Match by meaning/ });
    await expect(second).toHaveAttribute("aria-expanded", "false");
    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: /Read the requirement/ })).toHaveAttribute("aria-expanded", "false");
  });

  test("FAQ answers expand", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Is this keyword search?" }).click();
    await expect(page.getByText(/concept graph, latent semantic analysis/)).toBeVisible();
  });

  test("dock navigates between every view", async ({ page }) => {
    await page.goto("/");
    const dock = page.getByRole("navigation", { name: "Main" });
    await dock.getByRole("button", { name: "Spec audit" }).click();
    await expect(page).toHaveURL(/#audit/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Check a tender spec");
    await dock.getByRole("button", { name: "Standards library" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Every standard");
    await expect(dock.getByRole("button", { name: "Portal API" })).toHaveCount(0); // removed from the dock
    await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Portal API" }).click();
    await expect(page.getByText("/api/recommend/batch")).toBeVisible();
    await dock.getByRole("button", { name: "Find standards" }).click();
    await expect(page).toHaveURL(/#recommend/);
  });

  test("cursor eyes stay off when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByTestId("cursor-eyes")).toHaveCount(0);
  });

  test("keyboard: first Tab reaches the skip link", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  });
});

test.describe("Spec audit", () => {
  test("sample spec is scored with outdated, certification and sampling findings", async ({ page }) => {
    await page.goto("/#audit");
    await page.getByRole("button", { name: "Load sample" }).click();
    await expect(page.getByRole("img", { name: /Specification score \d+/ })).toBeVisible();
    await expect(page.getByText("Outdated version: IS 694:1990")).toBeVisible();
    await expect(page.getByText(/Mandatory ISI requirement missing/)).toBeVisible();
    await expect(page.getByText("No sampling plan stated")).toBeVisible();
    await expect(page.getByText("Fix: Replace with IS 694:2010.")).toBeVisible();
  });

  test("a clean spec scores well", async ({ page }) => {
    await page.goto("/#audit");
    await page.getByLabel("Paste a draft tender specification").fill(
      "Cables shall conform to IS 694:2010 with ISI mark under valid BIS licence. Conductors per IS 8130:2013. Tests per IS 10810:1984. Sampling per IS 2500 (Part 1).",
    );
    await page.getByRole("button", { name: "Check specification" }).click();
    await expect(page.getByText(/Ready to publish|Minor fixes needed/)).toBeVisible();
    await expect(page.getByText("0 critical")).toBeVisible();
  });
});

test.describe("Standards library", () => {
  test("filters by certification scheme and text", async ({ page }) => {
    await page.goto("/#library");
    await expect(page.getByText("82 standards")).toBeVisible();
    await page.getByLabel("Certification scheme").selectOption("CRS");
    await expect(page.getByText(/^\d+ standards$/)).not.toHaveText("82 standards");
    const cards = page.locator(".lib-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(3);
    for (let i = 0; i < count; i += 1) await expect(cards.nth(i)).toContainText("CRS registration");
    await page.getByLabel("Certification scheme").selectOption("");
    await page.getByLabel("Search standards").fill("helmet");
    await expect(page.getByText("2 standards")).toBeVisible();
  });
});

test.describe("Error handling", () => {
  test("an API failure shows a readable error instead of breaking the page", async ({ page }) => {
    await page.route("**/api/recommend", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ success: false, data: null, error: "Something went wrong on our side. Please try again.", meta: {} }) }));
    await page.goto("/");
    await page.getByLabel("Product description, technical spec or tender text").fill("cement");
    await page.getByRole("button", { name: /^Find standards Ctrl/ }).click();
    await expect(page.getByRole("alert")).toContainText("Something went wrong on our side");
  });

  test("an unreachable API is reported", async ({ page }) => {
    await page.route("**/api/recommend", (route) => route.abort());
    await page.goto("/");
    await page.getByLabel("Product description, technical spec or tender text").fill("cement");
    await page.getByRole("button", { name: /^Find standards Ctrl/ }).click();
    await expect(page.getByRole("alert")).toContainText("Cannot reach the SpecSetu API");
  });
});

test.describe("Motion layer", () => {
  test.use({ reducedMotion: "no-preference" });

  test("pinned cards reveal on scroll, settle, and the console stays clean", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/reveal-armed/);
    const firstCase = page.locator(".case").first();
    await expect(firstCase).not.toHaveClass(/\bin\b/);
    await firstCase.scrollIntoViewIfNeeded();
    await expect(firstCase).toHaveClass(/settled/, { timeout: 5000 });
    await expect(firstCase).toHaveCSS("opacity", "1");
    await expect(page.locator(".stat-card").first().locator("b")).toHaveText("82");
    expect(errors).toEqual([]);
  });

  test("cursor eyes trail the pointer, widen over buttons and sleep when idle", async ({ page }) => {
    await page.goto("/");
    const eyes = page.getByTestId("cursor-eyes");
    await expect(eyes).toBeAttached();
    await expect(eyes).not.toHaveClass(/is-awake/);

    await page.mouse.move(200, 300);
    await page.mouse.move(700, 420, { steps: 12 });
    await expect(eyes).toHaveClass(/is-awake/);
    const lagging = await eyes.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
    expect(lagging).toBeLessThan(700 + 26); // still catching up: trails behind the pointer

    await page.locator(".hero .btn-sticker").hover();
    await expect(eyes).toHaveClass(/is-curious/);

    await page.waitForTimeout(1000);
    await expect(eyes).not.toHaveClass(/is-awake/);
  });

  test("dock magnifies under the pointer", async ({ page }) => {
    await page.goto("/");
    const item = page.locator(".dock-item").first();
    await item.hover();
    await expect(item).toHaveAttribute("style", /scale\(1\.[1-9]/);
  });
});
