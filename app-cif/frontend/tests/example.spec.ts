import { test, expect } from '@playwright/test';

test('app loads and shows login screen', async ({ page }) => {
  await page.goto('/');

  // Use partial/regex match since RN Web can split text across nested elements
  await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});

test('shows emulator mode banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/running in emulator mode/i)).toBeVisible({ timeout: 30000 });
});




testing front end app process:

Excellent — that's the full pipeline working: phone → dev-client build → Metro → Firebase emulators, safely isolated from live data.

test@cif.local with password Test1234!

run app
npx cross-env EXPO_PUBLIC_USE_EMULATOR=true npx expo start --dev-client

adb devices
adb reverse tcp:9099 tcp:9099
adb reverse tcp:8080 tcp:8080
adb reverse tcp:9199 tcp:9199

run check:
maestro test booking-flow.yaml