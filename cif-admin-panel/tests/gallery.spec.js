// tests/gallery.spec.js
import { test, expect } from "@playwright/test";

test.describe("Gallery & Media Management Suite", () => {
  const uniqueCaption = `E2E Test Image ${Date.now()}`;
  const testImageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87";

  test("renders layout, loading state, and toggles tabs", async ({ page }) => {
    await page.goto("/gallery");

    // 1. Wait for Firebase data to load
    await expect(page.getByText("Loading gallery...")).toBeHidden({ timeout: 10000 });

    // 2. Verify headings
    await expect(page.getByRole("heading", { name: "Media Gallery" })).toBeVisible();

    // 3. Test Tab Switching
    const uploadTabBtn = page.getByRole("button", { name: "📁 Upload Files" });
    const urlTabBtn = page.getByRole("button", { name: "🔗 Add Image URL" });

    // Default state: Upload tab is active
    await expect(page.getByText("Click or drop images here to stage them")).toBeVisible();

    // Switch to URL tab
    await urlTabBtn.click();
    await expect(page.getByRole("heading", { name: "Add Image from External URL" })).toBeVisible();
    await expect(page.getByText("Click or drop images here to stage them")).toBeHidden();

    // Switch back
    await uploadTabBtn.click();
    await expect(page.getByRole("heading", { name: "Add Image from External URL" })).toBeHidden();
  });

  test("allows staging and removing files for upload using in-memory mock files", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Loading gallery...")).toBeHidden({ timeout: 10000 });

    // 1. Mock a file upload by generating a dummy file in memory
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'playwright-test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-content-for-testing')
    });

    // 2. Verify the file was staged successfully
    await expect(page.getByText("Staged for upload (1)")).toBeVisible();
    
    // React automatically formats the filename into a caption ("playwright test image")
    const captionInput = page.locator('input[type="text"]').filter({ hasValue: 'playwright test image' });
    await expect(captionInput).toBeVisible();

    // 3. Modify the caption of the staged file
    await captionInput.fill("Modified Caption Title");
    await expect(page.locator('input[type="text"]').filter({ hasValue: 'Modified Caption Title' })).toBeVisible();

    // 4. Remove the staged file
    await page.getByRole("button", { name: "Remove" }).click();
    
    // Verify the staging area is cleared
    await expect(page.getByText("Staged for upload")).toBeHidden();
  });

  test("adds an image via URL, opens the lightbox modal, and deletes it", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByText("Loading gallery...")).toBeHidden({ timeout: 10000 });

    // --- PART 1: ADD IMAGE VIA URL ---
    await page.getByRole("button", { name: "🔗 Add Image URL" }).click();

    await page.getByPlaceholder("Image URL (e.g. https://images.unsplash.com/...)").fill(testImageUrl);
    await page.getByPlaceholder("Caption / Description (optional)").fill(uniqueCaption);

    // ✅ Register the dialog listener BEFORE clicking save to catch the success alert reliably
    const dialogPromise = new Promise((resolve) => {
      page.once("dialog", async (dialog) => {
        expect(dialog.message()).toBe("Image added to gallery!");
        await dialog.accept();
        resolve();
      });
    });

    await page.getByRole("button", { name: "Save to Gallery" }).click();
    await dialogPromise; // Wait for dialog handling to finish

    // --- PART 2: VERIFY IN GRID & TEST LIGHTBOX ---
    // Search for the newly added image
    await page.getByPlaceholder("Filter gallery...").fill(uniqueCaption);

    // Locate the specific image card
    const imageCard = page.locator("div", { hasText: uniqueCaption }).first();
    await expect(imageCard).toBeVisible({ timeout: 15000 });

    // Click the image thumbnail to open the Lightbox (targets the img tag specifically)
    await imageCard.getByAltText(uniqueCaption).click();

    // Verify Lightbox opened
    const lightboxCloseBtn = page.getByRole("button", { name: "Close" });
    await expect(lightboxCloseBtn).toBeVisible();
    
    // Close Lightbox
    await lightboxCloseBtn.click();
    await expect(lightboxCloseBtn).toBeHidden();

    // --- PART 3: DELETE IMAGE ---
    // ✅ Register the delete confirmation dialog listener before clicking delete
    const deleteDialogPromise = new Promise((resolve) => {
      page.once("dialog", async (dialog) => {
        expect(dialog.message()).toBe("Delete this image permanently from the gallery?");
        await dialog.accept();
        resolve();
      });
    });

    // Click the delete button inside our specific image card
    await imageCard.getByRole("button", { name: "Delete" }).click();
    await deleteDialogPromise;

    // Verify the image disappears and the empty state shows up (since we are filtering by its unique name)
    await expect(imageCard).toBeHidden({ timeout: 15000 });
    await expect(page.getByText("No images found.")).toBeVisible();
  });

});