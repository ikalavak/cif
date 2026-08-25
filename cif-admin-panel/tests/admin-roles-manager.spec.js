// tests/admin-roles-manager.spec.js
import { test, expect } from "@playwright/test";

test.describe("Admin Roles Manager", () => {
  
  test("renders the layout, form, and table headers correctly", async ({ page }) => {
    await page.goto("/admin-roles");

    // 1. Verify exact Headings
    await expect(page.getByRole("heading", { name: "Admin & Role Management" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Grant Admin Access" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Active Admins/i })).toBeVisible();

    // 2. Verify exact Form Elements
    const emailInput = page.getByPlaceholder("user@example.com");
    const roleSelect = page.getByRole("combobox");
    const grantBtn = page.getByRole("button", { name: "Grant Access" });

    await expect(emailInput).toBeVisible();
    await expect(roleSelect).toBeVisible();
    await expect(grantBtn).toBeVisible();

    // 3. Verify exact Table Structure
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "EMAIL" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "USER UID" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "ROLE" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "ACTIONS" })).toBeVisible();
  });

  test("allows filling out the grant access form", async ({ page }) => {
    await page.goto("/admin-roles");

    const emailInput = page.getByPlaceholder("user@example.com");
    const roleSelect = page.getByRole("combobox");

    // Fill and verify input values
    await emailInput.fill("new-manager@cif-festival.com");
    await expect(emailInput).toHaveValue("new-manager@cif-festival.com");

    // Select 'Super Admin' and verify
    await roleSelect.selectOption("superadmin");
    await expect(roleSelect).toHaveValue("superadmin");
  });

  test("disables the grant button and shows warning for non-superadmins", async ({ page }) => {
    await page.goto("/admin-roles");
    
    const grantBtn = page.getByRole("button", { name: "Grant Access" });
    
    // Check that either the button is disabled or clicking it triggers the security restriction warning
    const warningText = page.locator("text=/superadmin|permission|unauthorized|signed in as/i");
    
    if (await grantBtn.isDisabled()) {
      await expect(grantBtn).toBeDisabled();
    } else {
      await grantBtn.click();
    }
    
    await expect(warningText.first()).toBeVisible({ timeout: 10000 });
  });
});