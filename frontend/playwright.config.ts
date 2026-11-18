import { defineConfig, devices } from "@playwright/test";

const channel = process.env.PW_CHANNEL ?? "chrome"; // uses the installed Chrome; set PW_CHANNEL=msedge for Edge

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  use: {
    baseURL: "http://localhost:5174",
    channel,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel, viewport: { width: 1440, height: 900 } }, testIgnore: /mobile.spec.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"], channel }, testMatch: /mobile\.spec\.ts/ },
  ],
  // The suite runs its own servers on separate ports with the AI layer off, so it is
  // deterministic, never spends NVIDIA credits, and never touches your dev servers.
  webServer: [
    {
      command: "python -m uvicorn app.main:app --port 8001",
      cwd: "../backend",
      url: "http://127.0.0.1:8001/api/health",
      reuseExistingServer: false,
      timeout: 60_000,
      env: { RATE_LIMIT_PER_MINUTE: "1000", ENABLE_LLM: "false", FEEDBACK_PATH: "../backend/app/data/runtime/e2e-feedback.jsonl" },
    },
    {
      command: "npx vite --port 5174 --strictPort",
      url: "http://localhost:5174",
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_API_TARGET: "http://127.0.0.1:8001" },
    },
  ],
});
