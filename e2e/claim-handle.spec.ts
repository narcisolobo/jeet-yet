import { test, expect } from "@playwright/test";

// Prerequisite: the Firebase emulators must already be running
// (`firebase emulators:start`) — Auth on :9099, Firestore on :8080,
// Functions on :5001 — since this exercises the real claimHandle Cloud
// Function, not a mock. playwright.config.ts's webServer only starts
// `pnpm dev`, not the emulators, so start them yourself before running
// this spec.

const FIRESTORE_DOCS_URL =
  "http://localhost:8080/v1/projects/jeet-yet/databases/(default)/documents";
const AUTH_EMULATOR_URL = "http://localhost:9099/identitytoolkit.googleapis.com/v1";
const CLAIM_HANDLE_URL =
  "http://localhost:5001/jeet-yet/us-central1/claimHandle";

interface FirestoreDocument {
  fields: Record<string, { stringValue?: string; nullValue?: null }>;
}

async function getFirestoreDoc(path: string) {
  const response = await fetch(`${FIRESTORE_DOCS_URL}/${path}`, {
    headers: { Authorization: "Bearer owner" },
  });
  if (response.status === 404) return null;
  return (await response.json()) as FirestoreDocument;
}

async function createEmulatedUser(email: string) {
  const response = await fetch(
    `${AUTH_EMULATOR_URL}/accounts:signUp?key=fake-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "password123",
        returnSecureToken: true,
      }),
    },
  );
  const body: { idToken: string; localId: string } = await response.json();

  // Mirrors the profiles/{uid} doc signInWithGoogle creates for a real new
  // user — claimHandle does an update (not set), so it 404s without one.
  // Other specs share this Firestore emulator and scan the whole profiles
  // collection, so this needs to look like a real profile doc (email
  // included), not a bare-bones stub other tests' predicates don't expect.
  await fetch(`${FIRESTORE_DOCS_URL}/profiles/${body.localId}`, {
    method: "PATCH",
    headers: {
      Authorization: "Bearer owner",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: body.localId },
        email: { stringValue: email },
        handle: { nullValue: null },
      },
    }),
  });

  return body;
}

test("claims a handle end to end via the onboarding UI", async ({
  page,
  context,
}) => {
  test.setTimeout(60_000);

  const email = `e2e-claim-${Date.now()}@example.com`;
  const displayName = "Claim Test User";
  const handle = `claim-test-${Date.now()}`;

  await page.goto("/auth/sign-in");

  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "Sign in with Google" }).click(),
  ]);

  await popup.waitForLoadState("domcontentloaded");
  await popup.getByText("Add new account").click();
  await popup.waitForTimeout(500);
  const inputs = popup.locator("input");
  await inputs.nth(0).fill(email);
  await inputs.nth(1).fill(displayName);
  await popup.getByRole("button", { name: "Sign in with Google.com" }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

  const handleInput = page.getByPlaceholder("your-handle");
  await handleInput.fill(handle);
  await page.getByRole("button", { name: "Confirm" }).click();

  // Confirming updates profiles/{uid}.handle, which the onboarding page's
  // live onSnapshot-backed guard picks up and redirects from on its own.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  await expect(async () => {
    const handleDoc = await getFirestoreDoc(`handles/${handle}`);
    expect(handleDoc?.fields.uid?.stringValue).toBeTruthy();

    const profilesRes = await fetch(`${FIRESTORE_DOCS_URL}/profiles`, {
      headers: { Authorization: "Bearer owner" },
    });
    const profilesBody: { documents?: FirestoreDocument[] } =
      await profilesRes.json();
    const profile = profilesBody.documents?.find(
      (doc) => doc.fields.email?.stringValue === email,
    );
    expect(profile?.fields.handle?.stringValue).toBe(handle);
  }).toPass({ timeout: 10000 });
});

test("rejects claiming an already-taken handle", async () => {
  const handle = `taken-${Date.now()}`;
  const firstUser = await createEmulatedUser(
    `e2e-first-${Date.now()}@example.com`,
  );

  const firstResponse = await fetch(CLAIM_HANDLE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${firstUser.idToken}`,
    },
    body: JSON.stringify({ data: { handle } }),
  });
  expect(firstResponse.ok).toBe(true);
  const firstBody = await firstResponse.json();
  expect(firstBody.result?.handle).toBe(handle);

  const secondUser = await createEmulatedUser(
    `e2e-second-${Date.now()}@example.com`,
  );
  const secondResponse = await fetch(CLAIM_HANDLE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secondUser.idToken}`,
    },
    body: JSON.stringify({ data: { handle } }),
  });
  const secondBody = await secondResponse.json();

  expect(secondResponse.ok).toBe(false);
  expect(secondBody.error?.status).toBe("ALREADY_EXISTS");
});
