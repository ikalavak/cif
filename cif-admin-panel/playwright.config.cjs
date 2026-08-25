// playwright.config.cjs (or playwright.config.js)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: [
    ['html'], // Generates the interactive web report
    ['junit', { outputFile: 'test-results/junit-report.xml' }] // Generates an XML report file
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.js/ },
    {
      name: 'chromium',
      use: {
        // Use the saved storage state from auth setup for all tests
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'], // ✅ This ensures setup runs successfully first!
    },
  ],
});