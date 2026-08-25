// tests/events-admin.spec.js
import { test, expect } from "@playwright/test";

test.describe("Events Management Suite", () => {

  test("renders layout, headings, and search bar", async ({ page }) => {
    await page.goto("/events");

    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
    await expect(page.getByText("Manage lifecycle, visibility, and featured status")).toBeVisible();
    await expect(page.getByPlaceholder("Search by title, venue, or category...")).toBeVisible();
    await expect(page.getByRole("heading", { name: "New Event" })).toBeVisible();
  });

  test("creates a new event and verifies it appears in the table", async ({ page }) => {
    await page.goto("/events");

    const uniqueEventTitle = `Test Keynote ${Date.now()}`;

    // Use id-based locators — the component uses htmlFor/id pairs
    const titleInput = page.locator("#eventTitle");
    await expect(titleInput).toBeVisible({ timeout: 15000 });

    await titleInput.fill(uniqueEventTitle);
    await page.locator("#eventImageUrl").fill("https://images.unsplash.com/photo-1540575467063-178a50c2df87");
    await page.locator("#eventCategory").fill("Tech");
    await page.locator("#eventVenue").fill("Main Stage");
    await page.locator("#eventStartDate").fill("2026-10-15T14:30");
    await page.locator("#eventStatus").selectOption("Open");
    await page.locator("#eventCapacity").fill("500");

    const publishedCheckbox = page.locator("#eventPublished");
    const featuredCheckbox = page.locator("#eventFeatured");

    if (!(await publishedCheckbox.isChecked())) await publishedCheckbox.check();
    if (!(await featuredCheckbox.isChecked())) await featuredCheckbox.check();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Event created!");
      await dialog.accept();
    });

    await page.getByRole("button", { name: "Save", exact: true }).click();

    // Form should reset after save
    await expect(titleInput).toHaveValue("", { timeout: 10000 });

    // Search and verify row
    await page.getByPlaceholder("Search by title, venue, or category...").fill(uniqueEventTitle);
    const eventRow = page.locator("tr", { hasText: uniqueEventTitle });
    await expect(eventRow).toBeVisible({ timeout: 15000 });
    await expect(eventRow).toContainText("Tech");
    await expect(eventRow).toContainText("Main Stage");
    await expect(eventRow).toContainText("500");
  });

  test("edits an existing event", async ({ page }) => {
    await page.goto("/events");

    const uniqueEventTitle = `Test Edit Keynote ${Date.now()}`;
    const updatedEventTitle = `${uniqueEventTitle} (Updated)`;

    const titleInput = page.locator("#eventTitle");
    await expect(titleInput).toBeVisible({ timeout: 15000 });

    await titleInput.fill(uniqueEventTitle);
    await page.locator("#eventCategory").fill("Tech");
    await page.locator("#eventVenue").fill("Room A");

    page.once("dialog", async (dialog) => await dialog.accept());
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(titleInput).toHaveValue("", { timeout: 10000 });

    const searchInput = page.getByPlaceholder("Search by title, venue, or category...");
    await searchInput.fill(uniqueEventTitle);

    const eventRow = page.locator("tr", { hasText: uniqueEventTitle });
    await expect(eventRow).toBeVisible({ timeout: 15000 });

    await eventRow.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Edit Event" })).toBeVisible();

    await titleInput.fill(updatedEventTitle);
    await page.locator("#eventCapacity").fill("1000");

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Event updated!");
      await dialog.accept();
    });

    await page.getByRole("button", { name: "Update" }).click();
    await expect(page.getByRole("heading", { name: "New Event" })).toBeVisible({ timeout: 10000 });

    await searchInput.fill(updatedEventTitle);
    const updatedRow = page.locator("tr", { hasText: updatedEventTitle });
    await expect(updatedRow).toBeVisible({ timeout: 15000 });
    await expect(updatedRow).toContainText("1000");
  });

  test("deletes an existing event", async ({ page }) => {
    await page.goto("/events");

    const uniqueEventTitle = `Test Delete Keynote ${Date.now()}`;

    const titleInput = page.locator("#eventTitle");
    await expect(titleInput).toBeVisible({ timeout: 15000 });

    await titleInput.fill(uniqueEventTitle);
    await page.locator("#eventCategory").fill("Tech");
    await page.locator("#eventVenue").fill("Room B");

    page.once("dialog", async (dialog) => await dialog.accept());
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(titleInput).toHaveValue("", { timeout: 10000 });

    const searchInput = page.getByPlaceholder("Search by title, venue, or category...");
    await searchInput.fill(uniqueEventTitle);

    const eventRow = page.locator("tr", { hasText: uniqueEventTitle });
    await expect(eventRow).toBeVisible({ timeout: 15000 });

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Are you sure you want to delete this event?");
      await dialog.accept();
    });

    await eventRow.getByRole("button", { name: "Delete" }).click();
    await expect(eventRow).toBeHidden({ timeout: 15000 });
  });
});