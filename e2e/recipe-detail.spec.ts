import { test, expect } from "@playwright/test";

// Prerequisite: the Firebase emulators must already be running
// (`firebase emulators:start`) — Firestore on :8080 — since this writes
// directly to the Firestore emulator's REST API rather than depending on
// `pnpm seed` having been run. playwright.config.ts's webServer only
// starts `pnpm dev`, not the emulators, so start them yourself before
// running this spec.

const FIRESTORE_DOCS_URL =
  "http://localhost:8080/v1/projects/jeet-yet/databases/(default)/documents";

async function createRecipeDoc(id: string) {
  await fetch(`${FIRESTORE_DOCS_URL}/recipes/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer owner",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        name: { stringValue: "E2E Test Recipe" },
        description: { stringValue: "A recipe created for e2e testing." },
        recipeIngredient: {
          arrayValue: {
            values: [
              {
                mapValue: {
                  fields: {
                    name: { stringValue: "flour" },
                    amount: { doubleValue: 2 },
                    unit: { stringValue: "cup" },
                  },
                },
              },
            ],
          },
        },
        recipeInstructions: {
          arrayValue: {
            values: [{ stringValue: "Mix the ingredients together." }],
          },
        },
        dateCreated: { timestampValue: new Date().toISOString() },
        importSourceType: { stringValue: "manual" },
        ownerId: { stringValue: "e2e-owner" },
      },
    }),
  });
}

test("renders a recipe's title, an ingredient, and a step", async ({
  page,
}) => {
  const id = `e2e-recipe-${Date.now()}`;
  await createRecipeDoc(id);

  await page.goto(`/recipes/${id}`);

  await expect(
    page.getByRole("heading", { name: "E2E Test Recipe" }),
  ).toBeVisible();
  await expect(page.getByText("2 cup flour")).toBeVisible();
  await expect(page.getByText("Mix the ingredients together.")).toBeVisible();
});

test("shows the deleted-recipe fallback for a nonexistent recipe", async ({
  page,
}) => {
  await page.goto("/recipes/nonexistent-id");

  await expect(
    page.getByText("This recipe has been deleted by the owner."),
  ).toBeVisible();
});
