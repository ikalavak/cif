// tests/categories.spec.js
import { test, expect } from "@playwright/test";

test.describe("Categories & Zones Management Suite", () => {
  const uniqueCategoryName = `Test Category ${Date.now()}`;

  test("renders layout, headings, and table", async ({ page }) => {
    await page.goto("/categories");

    await expect(page.getByRole("heading", { name: "Festival Categories & Zones" })).toBeVisible();
    await expect(page.getByText("Organize festival assets by genre")).toBeVisible();
    await expect(page.getByPlaceholder("Search categories...")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ Create" })).toBeVisible();
  });

  test("creates a new category and validates it appears in the table", async ({ page }) => {
    await page.goto("/categories");

    // 1. Open the modal
    await page.getByRole("button", { name: "+ Create" }).click();

    // 2. Wait for modal to appear
    await expect(page.getByRole("heading", { name: "Create Festival Category" })).toBeVisible({ timeout: 5000 });

    // 3. Fill form fields using placeholder (more robust than getByLabel for this component)
    await page.getByPlaceholder("e.g., VIP Cocktail Lounge, Techno Mainstage").fill(uniqueCategoryName);
    await page.getByPlaceholder("#3b82f6").fill("#ff0000");

    // 4. Select classification
    // The select has no id — target by its sibling label text
    const classificationSelect = page.locator("select").first();
    await classificationSelect.selectOption("tech");

    // 5. Save
    await page.getByRole("button", { name: "Save Category" }).click();

    // 6. Modal should close
    await expect(page.getByRole("heading", { name: "Create Festival Category" })).toBeHidden({ timeout: 5000 });

    // 7. Verify the new category appears in the table
    const categoryRow = page.locator("tr", { hasText: uniqueCategoryName });
    await expect(categoryRow).toBeVisible({ timeout: 10000 });
    await expect(categoryRow).toContainText("Tech");
  });

  test("prompts for confirmation when clicking delete", async ({ page }) => {
    await page.goto("/categories");

    // Ensure at least one category exists
    const rowCount = await page.locator("tbody tr").filter({ hasText: /./}).count();

    if (rowCount === 0) {
      // Create a temporary one
      await page.getByRole("button", { name: "+ Create" }).click();
      await expect(page.getByRole("heading", { name: "Create Festival Category" })).toBeVisible({ timeout: 5000 });
      await page.getByPlaceholder("e.g., VIP Cocktail Lounge, Techno Mainstage").fill(`Temp Delete ${Date.now()}`);
      await page.getByRole("button", { name: "Save Category" }).click();
      await expect(page.getByRole("heading", { name: "Create Festival Category" })).toBeHidden({ timeout: 5000 });
      await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });
    }

    // Set up the confirm dialog handler BEFORE clicking delete
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Are you sure you want to remove this category?");
      await dialog.dismiss(); // dismiss so we don't actually delete
    });

    await page.locator("tbody tr").first().getByRole("button", { name: "Delete" }).click();
  });
});