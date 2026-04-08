import { defineConfig } from '@playwright/test';
import { appConfig } from './support/env';

const headed = process.env.PLAYWRIGHT_HEADED === 'true';
const slowMo = Number(process.env.PLAYWRIGHT_SLOW_MO ?? (headed ? 250 : 0));

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 20_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
  ],
  outputDir: './test-results',
  use: {
    baseURL: appConfig.frontendBaseURL,
    viewport: { width: 1440, height: 1100 },
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    headless: !headed,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      slowMo,
    },
  },
  metadata: {
    frontendBaseURL: appConfig.frontendBaseURL,
    backendBaseURL: appConfig.backendBaseURL,
    allowProductionWrites: appConfig.allowProductionWrites,
  },
});
