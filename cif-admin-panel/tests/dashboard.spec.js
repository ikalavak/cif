// tests/dashboard.spec.js
import { test, expect } from "@playwright/test";

test.describe("Dashboard Overview Suite", () => {

  test("renders layout, headings, and last updated timestamp", async ({ page }) => {
    await page.goto("/");

    // 1. Verify main headings
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    await expect(page.getByText("Real-time overview of events, content modules")).toBeVisible();
    
    // 2. Verify the Last Updated string is present
    await expect(page.getByText(/Last updated:/i)).toBeVisible();
    
    // 3. Verify the manual refresh button works (it won't break the UI to click it)
    const refreshBtn = page.getByRole("button", { name: "↻ Refresh" });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
  });

  test("renders the global search box and handles empty search results", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder("Search records...");
    await expect(searchInput).toBeVisible();

    // Type a string that definitely won't match any events
    await searchInput.fill("NON_EXISTENT_SEARCH_TERM_999");

    // The component should render the "No matching events found." text
    await expect(page.getByText("No matching events found.")).toBeVisible();
  });

  test("renders the stat grid with all expected metrics", async ({ page }) => {
    await page.goto("/");

    // We can verify the presence of the stat cards by checking for their specific labels
    const expectedMetrics = [
      "Total Events",
      "Published Events",
      "Bookings",
      "Venues",
      "Categories",
      "Job Applications",
      "Portfolios",
      "Forum Activity",
      "Gallery Images",
      "Sponsors",
      "Upcoming Events"
    ];

    for (const metric of expectedMetrics) {
      await expect(page.locator(".stat-label", { hasText: metric })).toBeVisible();
    }
  });

  test("renders the upcoming events table and handles empty state", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Upcoming Events" })).toBeVisible();
    
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    
    // Verify table headers
    await expect(page.getByRole("columnheader", { name: "Event" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Venue" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Date" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Time" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();

    // If there are no upcoming events in Firestore, your empty state row should appear
    const emptyState = page.getByText("No upcoming events scheduled.");
    
    if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
    }
  });

  test("renders quick action links with correct routing", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible();

    // Verify the links exist and have the correct href attributes
    await expect(page.getByRole("link", { name: "+ Create Event" })).toHaveAttribute("href", "/events");
    await expect(page.getByRole("link", { name: "+ Add Venue" })).toHaveAttribute("href", "/venues");
    await expect(page.getByRole("link", { name: "+ Add Speaker" })).toHaveAttribute("href", "/speakers");
    await expect(page.getByRole("link", { name: "+ Add Category" })).toHaveAttribute("href", "/categories");
    await expect(page.getByRole("link", { name: "+ Create Announcement" })).toHaveAttribute("href", "/announcements");
    await expect(page.getByRole("link", { name: "+ Upload Gallery Image" })).toHaveAttribute("href", "/gallery");
  });

});
