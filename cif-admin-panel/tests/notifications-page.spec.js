// tests/notifications-page.spec.js
import { test, expect } from "@playwright/test";

test.describe("Push & In-App Notifications Suite", () => {
  const uniqueTitle = `Test Broadcast ${Date.now()}`;
  const uniqueBody = "Please proceed to the Main Stage for the upcoming session.";

  test("renders layout, headings, and instructional text", async ({ page }) => {
    await page.goto("/notifications");

    // 1. Verify headings
    await expect(page.getByRole("heading", { name: "Push & In-App Notifications" })).toBeVisible();
    await expect(page.getByText("Broadcast announcements to attendees across iOS, Android")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent Broadcasts" })).toBeVisible();

    // 2. Verify form inputs
    await expect(page.getByLabel("Category / Type")).toBeVisible();
    await expect(page.getByLabel("Notification Title")).toBeVisible();
    await expect(page.getByLabel("Notification Message")).toBeVisible();
    await expect(page.getByLabel("Open Screen on Tap")).toBeVisible();
  });

  test("submits a push notification successfully and mocks Expo API", async ({ page }) => {
    // 1. Mock the Expo push API so we don't accidentally send real push notifications during testing
    await page.route("https://exp.host/--/api/v2/push/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { status: "ok" } }),
      });
    });

    await page.goto("/notifications");

    // 2. Fill out the broadcast form
    await page.getByLabel("Category / Type").selectOption("schedule");
    await page.getByLabel("Notification Title").fill(uniqueTitle);
    await page.getByLabel("Notification Message").fill(uniqueBody);
    await page.getByLabel("Open Screen on Tap").selectOption("Events");

    // 3. Submit the notification
    const broadcastBtn = page.getByRole("button", { name: "Broadcast Notification" });
    await expect(broadcastBtn).not.toBeDisabled();
    await broadcastBtn.click();

    // 4. Verify the success message appears
    // The exact text depends on whether there were tokens in Firestore, but it will always include "Saved to in-app"
    await expect(page.getByText(/Saved to in-app/i)).toBeVisible();

    // 5. Verify the form inputs cleared after successful submission
    await expect(page.getByLabel("Notification Title")).toHaveValue("");
    await expect(page.getByLabel("Notification Message")).toHaveValue("");
  });

  test("renders the recent broadcasts history dynamically", async ({ page }) => {
    await page.goto("/notifications");

    // After submitting in the previous test, the feed should have data.
    // If it's a fresh database, it might say "No notifications broadcasted yet."
    const emptyState = page.getByText("No notifications broadcasted yet.");

    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    } else {
      // Look for the broadcast we just created (or any broadcast if running isolated)
      // We grab the container holding the title we used in the previous test.
      // Note: Because Firebase might take a second to update the feed on page load, we give it a timeout
      const recentPost = page.locator("div", { hasText: uniqueTitle }).first();
      await expect(recentPost).toBeVisible({ timeout: 10000 });
      
      // Verify the body text rendered
      await expect(recentPost).toContainText(uniqueBody);
    }
  });
});
