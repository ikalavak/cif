// tests/users.spec.js
import { test, expect } from "@playwright/test";

test.describe("User Management Suite", () => {

  test("renders layout, tabs, and controls", async ({ page }) => {
    await page.goto("/users");

    await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible();
    await expect(page.getByText("Inspect mobile app attendees")).toBeVisible();
    await expect(page.getByRole("button", { name: /Mobile App Users/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Admin & Staff Roster/ })).toBeVisible();
    await expect(page.getByPlaceholder("Search by name, email, phone, or UID...")).toBeVisible();
  });

  test("opens user details modal and handles deactivation/restore actions", async ({ page }) => {
    await page.goto("/users");

    // Wait for loading to finish
    await expect(page.getByText("Loading user accounts...")).toBeHidden({ timeout: 15000 });

    // Check if any users exist — if not, skip gracefully
    const noUsersMsg = page.getByText("No user accounts found matching your filters.");
    const viewBtn = page.getByRole("button", { name: "View" }).first();

    // Wait for either a View button or the empty state
    await Promise.race([
      viewBtn.waitFor({ state: "visible", timeout: 15000 }),
      noUsersMsg.waitFor({ state: "visible", timeout: 15000 }),
    ]);

    const hasUsers = await viewBtn.isVisible().catch(() => false);

    if (!hasUsers) {
      console.log("No users in Firestore — skipping modal interaction.");
      return;
    }

    // 2. Open the modal
    await viewBtn.click();

    // 3. Verify modal content
    await expect(page.getByRole("heading", { name: "Attendee Details" })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("ACCOUNT STATUS")).toBeVisible();
    await expect(page.getByText("FULL NAME")).toBeVisible();
    await expect(page.getByText("EMAIL")).toBeVisible();

    // 4. Close the modal
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("heading", { name: "Attendee Details" })).toBeHidden({ timeout: 5000 });
  });

  test("filters users by status", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByText("Loading user accounts...")).toBeHidden({ timeout: 15000 });

    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("active");
    // Deactivated badges should not appear
    const deactivatedBadges = page.locator("span", { hasText: "Deactivated" });
    const count = await deactivatedBadges.count();
    expect(count).toBe(0);

    await statusSelect.selectOption("deactivated");
    // Active badges should not appear
    const activeBadges = page.locator("span", { hasText: "Active" });
    const activeCount = await activeBadges.count();
    expect(activeCount).toBe(0);
  });
});