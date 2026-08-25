// tests/global-setup.js
import { chromium } from "@playwright/test";

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Go to your login page
  await page.goto("http://localhost:5173/login"); // Update with your local dev URL if different

  // 2. Perform UI login using your test credentials
  await page.getByLabel("Email").fill("test-admin@cif-festival.com");
  await page.getByLabel("Password").fill("TestPassword123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  // 3. Wait until it successfully redirects to the dashboard
  await page.waitForURL("**/dashboard");

  // 4. Save the active session state to disk
  await page.context().storageState({ path: "tests/.auth/user.json" });
  await browser.close();
}

export default globalSetup;