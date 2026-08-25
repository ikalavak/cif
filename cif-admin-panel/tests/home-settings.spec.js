// tests/home-settings.spec.js
import { test, expect } from "@playwright/test";

test.describe("Home Settings Management Suite", () => {
  const uniqueTitle = `CIF Test Festival ${Date.now()}`;

  test("renders layout, loading state, and section headings", async ({ page }) => {
    await page.goto("/home-settings");
    await expect(page.getByText("Loading settings...")).toBeHidden({ timeout: 15000 });

    await expect(page.getByRole("heading", { name: "Home Screen Settings" })).toBeVisible();
    await expect(page.getByText("Manage mobile app hero banners, about details")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Hero Banner" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "About the Festival" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Festival Highlights" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Call to Action Card" })).toBeVisible();
  });

  test("updates hero fields, about section, and cta, then saves successfully", async ({ page }) => {
    await page.goto("/home-settings");
    await expect(page.getByText("Loading settings...")).toBeHidden({ timeout: 15000 });

    const heroTitleInput = page.locator("div").filter({ hasText: /^Hero Title$/ }).locator("input");
    await expect(heroTitleInput).toBeVisible({ timeout: 10000 });
    await heroTitleInput.fill(uniqueTitle);
    await expect(heroTitleInput).toHaveValue(uniqueTitle);

    const datesInput = page.locator("div").filter({ hasText: /^Dates Display$/ }).locator("input");
    await datesInput.fill("10 - 15 October 2026");

    const aboutTextArea = page.locator('textarea[rows="4"]');
    await aboutTextArea.fill("This is a test description for the festival.");
    await expect(aboutTextArea).toHaveValue("This is a test description for the festival.");

    const ctaTitleInput = page.locator("div").filter({ hasText: /^CTA Title$/ }).locator("input");
    await ctaTitleInput.fill("Register Now");

    await page.getByRole("button", { name: "Save Settings" }).click();
    await expect(page.getByText("Home settings saved successfully!")).toBeVisible({ timeout: 15000 });
  });

  test("adds and removes dynamic festival highlight blocks", async ({ page }) => {
    await page.goto("/home-settings");
    await expect(page.getByText("Loading settings...")).toBeHidden({ timeout: 15000 });

    const highlightCards = page.locator('[data-testid="highlight-card"]');

    // Wait for cards to be present before snapshotting the count
    await expect(highlightCards.first()).toBeVisible({ timeout: 10000 });
    const initialCount = await highlightCards.count();

    const addButton = page.getByRole("button", { name: "+ Add Highlight" });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    // 1. Click and wait for count to increase
    await addButton.click();
    await expect(highlightCards).toHaveCount(initialCount + 1, { timeout: 5000 });

    // 2. Scope inputs to the newly added last card
    const newCard = highlightCards.last();

    const newTitleInput = newCard.locator('input[placeholder="Title"]');
    const newDescInput = newCard.locator('input[placeholder="Description"]');

    await expect(newTitleInput).toBeVisible({ timeout: 5000 });
    await newTitleInput.fill("Brand New Stage");
    await newDescInput.fill("An entirely new experience.");

    await expect(newTitleInput).toHaveValue("Brand New Stage");
    await expect(newDescInput).toHaveValue("An entirely new experience.");

    // 3. Remove the card and confirm count returns to initial
    await newCard.getByRole("button", { name: "Remove" }).click();
    await expect(highlightCards).toHaveCount(initialCount, { timeout: 5000 });
  });
});