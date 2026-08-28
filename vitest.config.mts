import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Require running Firestore/Storage emulators — run via `pnpm test:rules`,
    // not the default `pnpm test`.
    exclude: [
      "src/lib/firebase/firestore.rules.test.ts",
      "src/lib/firebase/storage.rules.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
