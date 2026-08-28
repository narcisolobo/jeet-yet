import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate config for firestore.rules.test.ts and storage.rules.test.ts,
// which require running Firestore/Storage emulators — run via
// `pnpm test:rules`. Kept out of the default `pnpm test` config
// (vitest.config.mts excludes these files) since that command has no
// emulator to connect to.
export default defineConfig({
  test: {
    environment: "node",
    include: [
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
