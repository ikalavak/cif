// tests/opportunities.spec.js
import { test, expect } from "@playwright/test";

test.describe("Opportunities Management Suite", () => {

  test("renders layout, headings, and dynamic form fields", async ({ page }) => {
    await page.goto("/opportunities");

    await expect(page.getByRole("heading", { name: "Opportunities" })).toBeVisible();
    await expect(page.getByText("Manage jobs, volunteering, internships, and vacancies.")).toBeVisible();
    
    await page.getByRole("button", { name: "+ Create" }).click();

    await expect(page.getByLabel("Title / Role")).toBeVisible();
    await expect(page.getByLabel("Company / Organization")).toBeVisible();
    await expect(page.getByLabel("Location")).toBeVisible();
    await expect(page.getByLabel("Type")).toBeVisible();
    await expect(page.getByLabel("Salary / Compensation")).toBeVisible();
    await expect(page.getByLabel("Job Description")).toBeVisible();
    await expect(page.getByLabel("Requirements / Qualifications")).toBeVisible();
    await expect(page.getByLabel("Application Contact Email")).toBeVisible();
    await expect(page.getByLabel("Active")).toBeVisible();
  });

  test("creates a new opportunity and verifies it in the data table", async ({ page }) => {
    await page.goto("/opportunities");

    const uniqueJobTitle = `E2E React Developer ${Date.now()}`;
    const companyName = "Festival Tech Corp";

    await page.getByRole("button", { name: "+ Create" }).click();
    
    const titleInput = page.getByLabel("Title / Role");
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    await titleInput.fill(uniqueJobTitle);
    await page.getByLabel("Company / Organization").fill(companyName);
    await page.getByLabel("Location").fill("London, UK (Hybrid)");
    await page.getByLabel("Salary / Compensation").fill("£45,000 - £55,000");
    await page.getByLabel("Application Contact Email").fill("jobs@festival.com");
    await page.getByLabel("Type").selectOption("Job");
    await page.getByLabel("Job Description").fill("We are looking for a React developer to build interactive experiences for the festival.");
    await page.getByLabel("Requirements / Qualifications").fill("3+ years of React experience. Familiarity with Firebase is a plus.");

    const activeCheckbox = page.getByLabel("Active");
    if (!(await activeCheckbox.isChecked())) {
      await activeCheckbox.check();
    }

    // ✅ Target the submit button explicitly using its HTML type attribute
    await page.locator("button[type='submit']").click();

    await page.waitForTimeout(1500);

    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill(uniqueJobTitle);

    const row = page.locator("tr", { hasText: uniqueJobTitle });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText(companyName);
    await expect(row).toContainText("London, UK");
  });

  test("edits an existing opportunity", async ({ page }) => {
    await page.goto("/opportunities");

    const uniqueJobTitle = `E2E Edit Job ${Date.now()}`;
    
    // 1. Create temporary item
    await page.getByRole("button", { name: "+ Create" }).click();
    const titleInput = page.getByLabel("Title / Role");
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    await titleInput.fill(uniqueJobTitle);
    await page.getByLabel("Company / Organization").fill("Edit Corp");
    await page.getByLabel("Location").fill("London");
    await page.getByLabel("Salary / Compensation").fill("£50,000");
    await page.getByLabel("Job Description").fill("Temporary description for editing test.");
    await page.locator("button[type='submit']").click();

    await page.waitForTimeout(1500);

    // 2. Search for the record in table
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.clear();
    await searchInput.fill(uniqueJobTitle);

    const row = page.locator("tr", { hasText: uniqueJobTitle });
    await expect(row).toBeVisible({ timeout: 15000 });

    // 3. Click Edit
    await row.getByRole("button", { name: /Edit/i }).click();

    // 4. Update salary field
    const salaryInput = page.getByLabel("Salary / Compensation");
    await expect(salaryInput).toBeVisible({ timeout: 10000 });
    await salaryInput.fill("£70,000");

    // 5. Submit update
    await page.locator("button[type='submit']").click();

    await page.waitForTimeout(1500);

    // 6. Verify table reflects update
    await searchInput.clear();
    await searchInput.fill(uniqueJobTitle);
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText("£70,000");
  });

  test("deletes an opportunity", async ({ page }) => {
    await page.goto("/opportunities");

    const uniqueJobTitle = `E2E Delete Job ${Date.now()}`;

    // 1. Create temporary item
    await page.getByRole("button", { name: "+ Create" }).click();
    const titleInput = page.getByLabel("Title / Role");
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    await titleInput.fill(uniqueJobTitle);
    await page.getByLabel("Company / Organization").fill("Delete Corp");
    await page.getByLabel("Location").fill("London");
    await page.getByLabel("Salary / Compensation").fill("£40,000");
    await page.getByLabel("Job Description").fill("Temporary description for deletion test.");
    await page.locator("button[type='submit']").click();

    await page.waitForTimeout(1500);

    // 2. Search for record
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.clear();
    await searchInput.fill(uniqueJobTitle);

    const row = page.locator("tr", { hasText: uniqueJobTitle });
    await expect(row).toBeVisible({ timeout: 15000 });

    // 3. Intercept deletion dialog
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    // 4. Click Delete
    await row.getByRole("button", { name: /Delete/i }).click();

    // 5. Verify removal
    await expect(row).toBeHidden({ timeout: 15000 });
  });

});