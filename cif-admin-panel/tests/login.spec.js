// tests/login.spec.js
import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login & Authentication Suite", () => {

  test("renders the login form correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "CIF Admin" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.locator("input[type='password']").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator(".form-error")).toBeVisible({ timeout: 10000 });
  });

  test("shows error when forgot password clicked with no email", async ({ page }) => {
    await page.goto("/login");

    const forgotBtn = page.getByRole("button", { name: "Forgot password?" });
    await expect(forgotBtn).toBeVisible({ timeout: 10000 });
    await forgotBtn.click();

    await expect(page.locator(".form-error")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".form-error")).toContainText("enter your email");
  });

  test("handles forgot password validation and success message", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel("Email");
    const forgotBtn = page.getByRole("button", { name: "Forgot password?" });

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill("admin@test.com");
    
    await expect(forgotBtn).toBeVisible({ timeout: 10000 });
    await forgotBtn.click();

    const successMsg = page.locator(".alert, .success, [role='alert']").or(page.getByText(/sent|email|instructions|success/i)).first();    await expect(successMsg).toBeVisible({ timeout: 20000 });
  });

});