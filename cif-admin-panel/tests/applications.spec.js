// tests/applications.spec.js
import { test, expect } from "@playwright/test";

test.describe("Applications Management Suite", () => {

  test("renders the layout, headings, and instructional text", async ({ page }) => {
    await page.goto("/applications");

    // 1. Verify exact Heading
    await expect(page.getByRole("heading", { name: "Job & Volunteering Applications" })).toBeVisible();
    
    // 2. Verify sub-text
    await expect(page.getByText("Review candidates, update hiring stages, and inspect submission notes.")).toBeVisible();
  });

  test("renders and interacts with search and filter controls", async ({ page }) => {
    await page.goto("/applications");

    // 1. Verify Search Input by its exact placeholder
    const searchInput = page.getByPlaceholder("Search by candidate name, email, or role...");
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // 2. Interact with the search box
    await searchInput.fill("John Doe");
    await expect(searchInput).toHaveValue("John Doe");

    // 3. Verify and interact with Status Dropdown
    const statusSelect = page.getByRole("combobox").first();
    await expect(statusSelect).toBeVisible({ timeout: 10000 });
    await statusSelect.selectOption("Shortlisted");
    await expect(statusSelect).toHaveValue("Shortlisted");
  });

  test("displays either the data table or the empty state message after loading", async ({ page }) => {
    await page.goto("/applications");

    // 1. Wait for the initial "Loading applications..." state to disappear
    await expect(page.getByText("Loading applications...")).toBeHidden({ timeout: 15000 });

    // 2. Handle dynamic Firebase data gracefully using a robust .or() locator check
    const emptyState = page.getByText("No candidate applications found matching the selected filters.");
    const dataTable = page.getByRole("table");

    // Wait until either the table or the empty state becomes visible
    await expect(dataTable.or(emptyState)).toBeVisible({ timeout: 15000 });

    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(dataTable).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Applicant" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Applied Role" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    }
  });

});