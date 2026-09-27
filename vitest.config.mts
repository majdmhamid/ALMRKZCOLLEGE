import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // server-only throws outside a React Server environment; stub it in tests.
      "server-only": fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    // Each suite boots its own PGlite (Postgres in WASM), which takes a few seconds.
    hookTimeout: 90_000,
    fileParallelism: false,
    env: { MOCK_BACKEND: "1" },
  },
});
