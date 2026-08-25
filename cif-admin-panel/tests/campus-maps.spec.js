// tests/campus-maps.spec.js
import { test, expect } from "@playwright/test";

test.describe("Campus Maps Management Suite", () => {
  
  test("renders layout, headings, and instructional text", async ({ page }) => {
    await page.goto("/campus-maps");

    // 1. Wait for the initial loading state to resolve
    await expect(page.getByText("Loading map settings...")).toBeHidden({ timeout: 10000 });

    // 2. Verify main headings
    await expect(page.getByRole("heading", { name: "Campus Maps Management" })).toBeVisible();
    await expect(page.getByText("Upload new floorplan images or paste direct image links")).toBeVisible();
    
    // 3. Verify section headings
    await expect(page.getByRole("heading", { name: "📍 Docklands Campus Map" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "📍 Stratford Campus Map" })).toBeVisible();
  });

  test("allows filling out the Docklands campus fields and shows image preview", async ({ page }) => {
    await page.goto("/campus-maps");
    await expect(page.getByText("Loading map settings...")).toBeHidden({ timeout: 10000 });

    const docklandsUrlInput = page.getByPlaceholder("https://images.unsplash.com/...").first();
    const docklandsDescInput = page.getByPlaceholder("e.g. University Way, Royal Docks").first();

    // 1. Enter URL and Description
    const testImageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87";
    await docklandsUrlInput.fill(testImageUrl);
    await docklandsDescInput.fill("Docklands Test Address");

    await expect(docklandsUrlInput).toHaveValue(testImageUrl);
    await expect(docklandsDescInput).toHaveValue("Docklands Test Address");

    // 2. Verify the Image Preview appears
    const previewImage = page.getByAltText("Docklands Preview");
    await expect(previewImage).toBeVisible();
    await expect(previewImage).toHaveAttribute("src", testImageUrl);

    // 3. Verify "Clear Image" button functionality
    const clearBtn = page.getByRole("button", { name: "Clear Image" }).first();
    await expect(clearBtn).toBeVisible();
    
    await clearBtn.click();
    await expect(docklandsUrlInput).toHaveValue("");
    await expect(previewImage).toBeHidden();
  });

  test("allows filling out the Stratford campus fields and shows image preview", async ({ page }) => {
    await page.goto("/campus-maps");
    await expect(page.getByText("Loading map settings...")).toBeHidden({ timeout: 10000 });

    // Using nth() to target the second set of inputs on the page
    const stratfordUrlInput = page.getByPlaceholder("https://images.unsplash.com/...").nth(1);
    const stratfordDescInput = page.getByPlaceholder("e.g. Water Lane, Stratford").first(); // It has a unique placeholder

    // 1. Enter URL and Description
    const testImageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87";
    await stratfordUrlInput.fill(testImageUrl);
    await stratfordDescInput.fill("Stratford Test Address");

    await expect(stratfordUrlInput).toHaveValue(testImageUrl);
    await expect(stratfordDescInput).toHaveValue("Stratford Test Address");

    // 2. Verify the Image Preview appears
    const previewImage = page.getByAltText("Stratford Preview");
    await expect(previewImage).toBeVisible();
    await expect(previewImage).toHaveAttribute("src", testImageUrl);
  });

  test("submits the form and displays the success message", async ({ page }) => {
    await page.goto("/campus-maps");
    await expect(page.getByText("Loading map settings...")).toBeHidden({ timeout: 10000 });

    const saveBtn = page.getByRole("button", { name: "Save Campus Maps" });
    
    // We expect the success message to appear after clicking save
    await saveBtn.click();
    await expect(page.getByText("Campus maps updated successfully!")).toBeVisible();
  });

});