import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate config for firestore.rules.test.ts, which requires a running
// Firestore emulator — run via `pnpm test:rules`. Kept out of the default
// `pnpm test` config (vitest.config.mts excludes this file) since that
// command has no emulator to connect to.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/lib/firebase/firestore.rules.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
