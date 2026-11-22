import { expect, test, type Page } from "@playwright/test";

/** Answer whatever exercise is on screen (deliberately simple: not always right). */
async function answerCurrent(page: Page) {
  const radios = page.locator("[role=radio]:not([disabled])");
  if (await radios.count()) return radios.first().click();
  const bank = page.getByLabel("Word bank").getByRole("button");
  if (await bank.count()) {
    const n = await bank.count();
    for (let i = 0; i < n; i++) await bank.first().click();
    return;
  }
  await page.locator("input[lang=fr]:not([disabled]), textarea[lang=fr]:not([disabled])").first().fill("je suis");
}

test("complete today's lesson and see updated progress", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Bon(jour|soir)/);
  await expect(page.getByText("Week 1 · Day 1")).toBeVisible();

  await page.getByRole("button", { name: "Start today's lesson" }).click();
  await page.waitForURL(/\/lesson\//);
  await expect(page.getByRole("heading", { name: "Subject pronouns" })).toBeVisible();
  await page.getByRole("button", { name: "Start practice" }).click();

  // Reload mid-lesson: progress must persist.
  await answerCurrent(page);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Continue|Try again/ })).toBeVisible();

  for (let step = 0; step < 60; step++) {
    if (await page.getByText("Lesson complete").isVisible()) break;
    const cont = page.getByRole("button", { name: /^Continue/ });
    if (await cont.isVisible()) {
      await cont.click();
      await expect(cont).toBeHidden();
      continue;
    }
    const reveal = page.getByRole("button", { name: "Show answer" });
    if (await reveal.isVisible()) {
      await reveal.click();
      await expect(reveal).toBeHidden();
      continue;
    }
    const check = page.getByRole("button", { name: "Check" });
    if (await check.isVisible()) {
      await answerCurrent(page);
      await expect(check).toBeEnabled();
      await check.click();
      await expect(check).toBeHidden();
    }
    await page.waitForTimeout(150);
  }
  await expect(page.getByText("Lesson complete")).toBeVisible();
  await expect(page.getByText(/Mastery \d+% →/)).toBeVisible();

  await page.getByRole("link", { name: "Back to today" }).click();
  await expect(page.getByText("Today's lesson is done. Félicitations !")).toBeVisible();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();

  await page.goto("/progress");
  const tile = page.locator(".card", { hasText: "Lessons completed" });
  await expect(tile.getByText("1", { exact: true })).toBeVisible();
  await expect(page.getByText(/1 active day/)).toBeVisible();

  await page.goto("/history");
  await expect(page.getByRole("link", { name: /Subject pronouns/ })).toBeVisible();
});
