import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:3100" },
  webServer: [
    {
      command:
        "DATABASE_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit MERCHANT_WALLET=7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE NODE_ENV=development pnpm --filter @usemeterkit/gateway dev",
      url: "http://127.0.0.1:3402/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        "NEXT_PUBLIC_GATEWAY_URL=http://127.0.0.1:3402 pnpm --filter @usemeterkit/web exec next dev -p 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
