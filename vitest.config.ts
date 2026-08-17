import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    // PostgreSQL integration files share one destructive test database. Running
    // files in parallel lets one suite truncate rows while another asserts on
    // them, which makes CI nondeterministic.
    fileParallelism: false,
    include: ["**/*.test.{ts,tsx}"],
    coverage: { reporter: ["text"] },
  },
});
