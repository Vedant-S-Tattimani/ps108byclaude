// Captures app screenshots for the report. Needs backend on :8000 and frontend on :5173.
// Copy into frontend/ (so @playwright/test resolves) and run:  node capture.mjs
import { chromium } from "@playwright/test";
import path from "node:path";

const out = path.resolve("../docs/report/img");
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
const hideChrome = () => page.addStyleTag({ content: ".dock,.topbar{display:none!important}" }).catch(() => undefined);
const element = async (name, locator) => {
  await hideChrome();
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await locator.screenshot({ path: path.join(out, `${name}.png`) });
};

await page.goto("http://localhost:5173/#recommend");
await page.waitForSelector(".stat-card");
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(out, "hero.png") });

await page.getByLabel("Product description, technical spec or tender text").fill("1.1 kV XLPE armoured aluminium power cable 4 core 95 sq mm for substation");
await page.getByRole("button", { name: /^Find standards Ctrl/ }).click();
await page.waitForSelector(".rec");
await element("understanding", page.locator(".understanding"));
await element("results", page.locator(".rec.top"));
await element("certification", page.locator(".cert").first());
await element("checklist", page.getByTestId("spec-checklist"));
await element("allied", page.locator('section[aria-labelledby="allied-h"]'));
await element("clause", page.locator('section[aria-labelledby="clause-h"]'));

await page.goto("http://localhost:5173/#recommend");
await page.locator('input[type="file"]').setInputFiles(path.resolve("e2e/fixtures/tender.txt"));
await page.getByTestId("tender-items").waitFor();
await element("tender-items", page.getByTestId("tender-items"));

await page.goto("http://localhost:5173/#audit");
await page.getByRole("button", { name: "Load sample" }).click();
await page.waitForSelector(".finding");
await element("audit", page.locator(".audit-head").locator(".."));

await page.goto("http://localhost:5173/widget-demo");
await page.getByRole("button", { name: "Suggest Indian Standards" }).click();
await page.getByRole("button", { name: "Insert clause" }).waitFor();
await element("widget", page.locator("main"));

await page.goto("http://localhost:5173/#recommend");
await page.getByRole("button", { name: "हिं" }).click();
await element("hindi", page.locator(".workspace .paper.sticky"));

await browser.close();
console.log("screenshots written to", out);
