// tests/forum-moderation.spec.js
import { test, expect } from "@playwright/test";

test.describe("Forum Moderation Suite", () => {

  test("renders layout, headings, and instructional text", async ({ page }) => {
    await page.goto("/forum-moderation");

    // 1. Wait for initial Firebase load to resolve
    await expect(page.getByText("Loading forum feed...")).toBeHidden({ timeout: 10000 });

    // 2. Verify main headings
    await expect(page.getByRole("heading", { name: "Forum Moderation & Broadcast" })).toBeVisible();
    await expect(page.getByText("Manage live discussions, resolve flagged content")).toBeVisible();

    // 3. Verify Broadcaster section
    await expect(page.getByRole("heading", { name: "📢 Broadcast Official Announcement" })).toBeVisible();
  });

  test("submits an official broadcast announcement", async ({ page }) => {
    await page.goto("/forum-moderation");
    await expect(page.getByText("Loading forum feed...")).toBeHidden({ timeout: 10000 });

    const broadcastInput = page.getByPlaceholder("Type urgent announcement or official schedule update...");
    const broadcastBtn = page.getByRole("button", { name: "Broadcast & Pin" });
    const channelSelect = page.getByRole("combobox").first(); // The first select is the channel dropdown

    // 1. Enter broadcast data
    await channelSelect.selectOption("Meetups");
    await broadcastInput.fill("Main stage is delayed by 15 minutes.");

    // 2. Setup an event listener to intercept and accept the success alert
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Official announcement broadcasted and pinned successfully!");
      await dialog.accept();
    });

    // 3. Submit the form
    await broadcastBtn.click();

    // 4. Verify the input clears after successful broadcast
    await expect(broadcastInput).toHaveValue("");
  });

  test("filters messages using the search box and quick filter tabs", async ({ page }) => {
    await page.goto("/forum-moderation");
    await expect(page.getByText("Loading forum feed...")).toBeHidden({ timeout: 10000 });

    // 1. Test Search Box with a guaranteed empty result
    const searchInput = page.getByPlaceholder("Search by user, message content, or channel...");
    await searchInput.fill("NON_EXISTENT_FORUM_POST_999");
    await expect(page.getByText("No messages found matching the selected criteria.")).toBeVisible();

    // Clear search for the next steps
    await searchInput.fill("");

    // 2. Test Quick Filter Tabs (Using Regex to match the dynamic count numbers)
    const allBtn = page.getByRole("button", { name: /All Messages/i });
    const flaggedBtn = page.getByRole("button", { name: /🚩 Flagged/i });
    const pinnedBtn = page.getByRole("button", { name: /📌 Pinned/i });

    await expect(allBtn).toBeVisible();
    await expect(flaggedBtn).toBeVisible();
    await expect(pinnedBtn).toBeVisible();

    // Click through filters to ensure the UI doesn't crash
    await flaggedBtn.click();
    await pinnedBtn.click();
    await allBtn.click();
  });

  test("displays data table or empty state safely", async ({ page }) => {
    await page.goto("/forum-moderation");
    await expect(page.getByText("Loading forum feed...")).toBeHidden({ timeout: 10000 });

    const emptyState = page.getByText("No messages found matching the selected criteria.");
    const dataTable = page.getByRole("table");

    // 1. Safely handle the dynamic data response
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(dataTable).toBeVisible();
      
      // 2. Verify Table Headers
      await expect(page.getByRole("columnheader", { name: "Author & Status" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Channel" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Message Content" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Reports / Likes" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Moderation Actions" })).toBeVisible();
    }
  });

});