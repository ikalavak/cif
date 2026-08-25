// tests/bookings.spec.js
import { test, expect } from "@playwright/test";

test.describe("Bookings & Ticket Verification Suite", () => {

  test("renders the layout, headings, and verification tool", async ({ page }) => {
    await page.goto("/bookings");

    // 1. Verify main headings
    await expect(page.getByRole("heading", { name: "Attendee Bookings" })).toBeVisible();
    await expect(page.getByText(/Inspect real-time event passes, check-in attendees/i)).toBeVisible();

    // 2. Verify Ticket Tool heading
    await expect(page.getByRole("heading", { name: "Verify Ticket / Door Check-In" })).toBeVisible();
  });

  test("interacts with the ticket verification scanner and handles invalid IDs", async ({ page }) => {
    await page.goto("/bookings");

    const verifyInput = page.getByPlaceholder("Scan or enter Ticket ID / User UID...");
    const verifyBtn = page.getByRole("button", { name: "Verify Pass" });

    // 1. Verify input is present
    await expect(verifyInput).toBeVisible();
    await expect(verifyBtn).toBeVisible();

    // 2. Simulate scanning an invalid/fake QR code
    await verifyInput.fill("FAKE-TICKET-999");
    await verifyBtn.click();

    // 3. Verify that your exact error block renders dynamically
    await expect(page.getByText('❌ No active reservation found for code: "fake-ticket-999"')).toBeVisible();

    // 4. Verify that the "Clear" button appears and works
    const clearBtn = page.getByRole("button", { name: "Clear" });
    await expect(clearBtn).toBeVisible();
    
    await clearBtn.click();
    
    // 5. Assert that clicking clear resets the form
    await expect(verifyInput).toHaveValue("");
    await expect(clearBtn).toBeHidden();
  });

  test("interacts with search and filter controls", async ({ page }) => {
    await page.goto("/bookings");

    // 1. Test the main search box
    const searchInput = page.getByPlaceholder("Search by attendee, email, event, or Ticket ID...");
    await searchInput.fill("test@cif-festival.com");
    await expect(searchInput).toHaveValue("test@cif-festival.com");

    // 2. Test the Status Filter dropdown
    // Since there are two unlabelled <select> elements, we grab them by role and index
    const selects = page.getByRole("combobox");
    const eventFilter = selects.nth(0);
    const statusFilter = selects.nth(1);

    await statusFilter.selectOption("checked_in");
    await expect(statusFilter).toHaveValue("checked_in");
  });

  test("displays data table or empty state after loading", async ({ page }) => {
    await page.goto("/bookings");

    // 1. Wait for the initial "Loading bookings..." text to resolve
    await expect(page.getByText("Loading bookings...")).toBeHidden({ timeout: 10000 });

    // 2. Handle dynamic Firebase data gracefully
    const emptyState = page.getByText("No bookings found matching your search.");
    const dataTable = page.getByRole("table");

    // If the database is empty, assert the empty message. Otherwise, assert the table headers.
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(dataTable).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Ticket Ref" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Attendee" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    }
  });

});