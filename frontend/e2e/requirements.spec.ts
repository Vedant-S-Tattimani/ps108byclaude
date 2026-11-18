import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

async function search(page: Page, text: string) {
  await page.getByLabel("Product description, technical spec or tender text").fill(text);
  await page.getByRole("button", { name: /^Find standards Ctrl/ }).click();
  await expect(page.locator(".rec").first()).toBeVisible();
}

const topDesignation = (page: Page) => page.locator(".rec").first().locator(".designation");

test.beforeEach(async ({ page }) => {
  await page.goto("/#recommend");
  await expect(page.locator(".stat-card").first()).toContainText("Standards mapped");
});

test.describe("R1 · accepts descriptions, specifications and tender documents", () => {
  test("free-text product description", async ({ page }) => {
    await search(page, "TMT saria Fe 500D for school building");
    await expect(topDesignation(page)).toHaveText("IS 1786:2008");
    await expect(page.getByText("Parameters", { exact: true })).toBeVisible();
    await expect(page.locator(".understanding")).toContainText("Fe 500D");
  });

  test("tender document upload is split into line items", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(path.join(fixtures, "tender.txt"));
    const items = page.getByTestId("tender-items");
    await expect(items).toContainText("5 line items found");
    for (const designation of ["IS 694:2010", "IS 10322 (Part 5/Sec 3):2012", "IS 1786:2008", "IS 269:2015", "IS 14543:2016"]) {
      await expect(items).toContainText(designation);
    }
    await expect(items).not.toContainText("Earnest money");
  });

  test("clicking a tender line item analyses it in full and keeps the list", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(path.join(fixtures, "tender.txt"));
    await page.getByRole("button", { name: /OPC 53 grade cement/ }).click();
    await expect(topDesignation(page)).toHaveText("IS 269:2015");
    await expect(page.getByTestId("tender-items")).toBeVisible();
  });

  test("unsupported file type is rejected with a clear message", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles({ name: "virus.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") });
    await expect(page.getByRole("alert")).toContainText("Upload a .pdf, .docx or .txt file.");
  });
});

test.describe("R2 · semantic recommendation", () => {
  test("everyday word maps to the right standard", async ({ page }) => {
    await search(page, "geyser for hostel bathrooms 25 litre");
    await expect(topDesignation(page)).toHaveText("IS 2082:1993");
    await expect(page.locator(".rec").first().locator(".reasons")).toContainText("water heater");
  });

  test("misspelt query still matches", async ({ page }) => {
    await search(page, "copper house wiring cabel 1.5 sq mm");
    await expect(topDesignation(page)).toHaveText("IS 694:2010");
  });

  test("unrelated item is flagged as low confidence", async ({ page }) => {
    await search(page, "paint for walls");
    await expect(page.getByText("No confident match")).toBeVisible();
  });
});

test.describe("R3 · allied standards", () => {
  test("groups normative, test, terminology, installation and sampling standards", async ({ page }) => {
    await search(page, "1.1 kV XLPE armoured aluminium power cable for substation");
    const allied = page.locator('section[aria-labelledby="allied-h"]');
    for (const group of ["Normative references", "Test methods", "Terminology", "Installation & codes of practice", "Sampling & inspection"]) {
      await expect(allied.getByRole("heading", { name: group })).toBeVisible();
    }
    await expect(allied).toContainText("IS 10810 (series):1984");
  });

  test("safety standards are linked for appliances", async ({ page }) => {
    await search(page, "split air conditioner 1.5 ton inverter");
    await expect(page.getByRole("heading", { name: "Safety standards" })).toBeVisible();
  });

  test("allied map node opens the standard's reference graph", async ({ page }) => {
    await search(page, "1.1 kV XLPE armoured aluminium power cable for substation");
    await page.locator(".graph .node").first().click();
    const drawer = page.getByRole("dialog", { name: "Standard details" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Version history")).toBeVisible();
  });
});

test.describe("R4 · latest version and amendments", () => {
  test("card and drawer show the latest version, amendments and superseded versions", async ({ page }) => {
    await search(page, "TMT bars Fe 500D");
    const top = page.locator(".rec").first();
    await expect(top).toContainText("Latest: 2008 · Amd 3 (2017)");
    await expect(top).toContainText("Supersedes 1985");
    await top.click();
    const drawer = page.getByRole("dialog", { name: "Standard details" });
    await expect(drawer.locator(".timeline .old")).toHaveText("IS 1786:1985");
    await expect(drawer).toContainText("Amd 3 · 2017");
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });
});

test.describe("R5 · mandatory certification", () => {
  for (const [query, title] of [
    ["OPC 53 grade cement", "BIS Standard Mark (ISI)"],
    ["laptops for district office", "Compulsory Registration Scheme"],
    ["22 carat gold medals for state awards", "BIS Hallmarking with HUID"],
  ] as const) {
    test(`${title} is flagged for “${query}”`, async ({ page }) => {
      await search(page, query);
      const cert = page.locator(".cert").first();
      await expect(cert).toContainText(title);
      await expect(cert.locator(".stamp")).toHaveText("Mandatory");
    });
  }
});

test.describe("R6 · multilingual and natural-language input", () => {
  for (const [query, language, designation] of [
    ["बोतलबंद पीने का पानी 20 लीटर जार", "Hindi / Marathi (Devanagari)", "IS 14543:2016"],
    ["સિમેન્ટ ૫૩ ગ્રેડ", "Gujarati", "IS 269:2015"],
    ["தலைக்கவசம்", "Tamil", "IS 4151:2015"],
  ] as const) {
    test(`${language}: ${query}`, async ({ page }) => {
      await search(page, query);
      await expect(page.locator(".understanding")).toContainText(language);
      await expect(page.locator(".rec .designation").filter({ hasText: designation })).toBeVisible();
    });
  }

  test("natural-language question", async ({ page }) => {
    await search(page, "Which standard applies when we buy LED bulbs for offices?");
    await expect(topDesignation(page)).toHaveText("IS 16102 (Part 1):2012");
  });
});

test.describe("Tender clause output", () => {
  test("clause cites the latest version and certification, and can be copied", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: async (text: string) => { (window as unknown as { __copied: string }).__copied = text; } },
      });
    });
    await page.reload();
    await search(page, "LED street lights 90W for municipal roads");
    const clause = page.locator("pre.clause");
    await expect(clause).toContainText("IS 10322 (Part 5/Sec 3):2012");
    await expect(clause).toContainText("CRS certification is mandatory");
    await page.getByRole("button", { name: "Copy clause" }).click();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __copied: string }).__copied)).toContain("TECHNICAL SPECIFICATION");
  });

  test("clause downloads as a text file", async ({ page }) => {
    await search(page, "LED street lights 90W for municipal roads");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: ".txt" }).click()]);
    expect(download.suggestedFilename()).toBe("tender-technical-specification.txt");
    const file = await download.path();
    const { readFile } = await import("node:fs/promises");
    expect(await readFile(file, "utf-8")).toContain("IS 10322 (Part 5/Sec 3):2012");
  });
});
