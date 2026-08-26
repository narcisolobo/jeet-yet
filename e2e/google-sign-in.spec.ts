import { test, expect } from "@playwright/test";

// Prerequisite: the Firebase emulators must already be running
// (`firebase emulators:start`) — Auth on :9099, Firestore on :8080 — since
// this exercises the real signInWithPopup -> profiles/{uid} write, not a
// mock. playwright.config.ts's webServer only starts `pnpm dev`, not the
// emulators, so start them yourself before running this spec.

const FIRESTORE_DOCS_URL =
  "http://localhost:8080/v1/projects/jeet-yet/databases/(default)/documents";

interface FirestoreDocument {
  fields: {
    email?: { stringValue: string };
    displayName?: { stringValue: string };
    handle?: { nullValue: null };
  };
}

test("creates a profiles/{uid} doc for a brand-new Google sign-in", async ({
  page,
  context,
}) => {
  // A cold `next dev` compiles /auth/sign-in on first request, which can be
  // slow enough that the popup's fill actions exceed the default 30s test
  // timeout (seen locally: passes in ~3s against an already-warm server).
  // Give this one more headroom for a fresh/CI run.
  test.setTimeout(60_000);

  const email = `e2e-${Date.now()}@example.com`;
  const displayName = "E2E Test User";

  await page.goto("/auth/sign-in");

  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "Sign in with Google" }).click(),
  ]);

  await popup.waitForLoadState("domcontentloaded");
  await popup.getByText("Add new account").click();
  // The picker->form transition (especially once the Auth Emulator already
  // has other accounts) can briefly leave the new-account inputs present
  // but not yet visible/interactable; settle before filling.
  await popup.waitForTimeout(500);
  const inputs = popup.locator("input");
  await inputs.nth(0).fill(email);
  await inputs.nth(1).fill(displayName);
  await popup.getByRole("button", { name: "Sign in with Google.com" }).click();

  // A brand-new user has no handle yet, so /auth/sign-in redirects to
  // /onboarding once signed in, which shows the handle-picker dialog.
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });
  await expect(
    page.getByRole("heading", { name: "Choose your public handle" }),
  ).toBeVisible();

  // The Firestore write happens inside signInWithGoogle, independently of
  // the onAuthStateChanged listener that updates the UI above, so poll
  // briefly rather than assuming it's already settled.
  await expect(async () => {
    const response = await fetch(`${FIRESTORE_DOCS_URL}/profiles`, {
      headers: { Authorization: "Bearer owner" },
    });
    const body: { documents?: FirestoreDocument[] } = await response.json();
    const doc = body.documents?.find(
      (candidate) => candidate.fields.email?.stringValue === email,
    );

    expect(doc).toBeTruthy();
    expect(doc?.fields.displayName?.stringValue).toBe(displayName);
    expect(doc?.fields.handle).toEqual({ nullValue: null });
  }).toPass({ timeout: 10000 });
});
