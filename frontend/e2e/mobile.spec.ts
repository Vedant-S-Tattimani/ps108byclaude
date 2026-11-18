import { expect, test } from "@playwright/test";

test("phone: no sideways scroll, dock reachable, search works", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const dockButton = page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Spec audit" });
  const box = await dockButton.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  await page.getByLabel("Product description, technical spec or tender text").fill("LED street light 90W");
  await page.getByRole("button", { name: /^Find standards Ctrl/ }).click();
  await expect(page.locator(".rec").first().locator(".designation")).toHaveText("IS 10322 (Part 5/Sec 3):2012");
  await expect(page.getByTestId("cursor-eyes")).toHaveCount(0); // touch devices get no cursor follower
  const afterResults = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(afterResults).toBeLessThanOrEqual(0);
});
