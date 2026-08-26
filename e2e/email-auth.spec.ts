import { test, expect } from "@playwright/test";

// Prerequisite: the Firebase emulators must already be running
// (`firebase emulators:start`) — Auth on :9099, Firestore on :8080 — since
// this exercises the real createUserWithEmailAndPassword/
// signInWithEmailAndPassword calls, not a mock. playwright.config.ts's
// webServer only starts `pnpm dev`, not the emulators, so start them
// yourself before running this spec.

const FIRESTORE_DOCS_URL =
  "http://localhost:8080/v1/projects/jeet-yet/databases/(default)/documents";
const AUTH_EMULATOR_URL =
  "http://localhost:9099/identitytoolkit.googleapis.com/v1";

interface FirestoreDocument {
  fields: {
    email?: { stringValue: string };
    handle?: { nullValue: null } | { stringValue: string };
  };
}

// Creates an account directly via the Auth Emulator REST API (bypassing the
// UI) and mirrors the profiles/{uid} doc signUpWithEmail creates for a real
// sign-up, so a signed-in-but-no-profile-doc user doesn't leave
// profileLoading stuck true forever (see AuthProvider's profile effect).
async function createEmulatedUser(email: string, password: string) {
  const response = await fetch(
    `${AUTH_EMULATOR_URL}/accounts:signUp?key=fake-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const body: { idToken: string; localId: string } = await response.json();

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

test.describe("sign up with email/password", () => {
  test("creates an account and a profiles/{uid} doc, landing on /onboarding", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const email = `e2e-signup-${Date.now()}@example.com`;
    const password = "Str0ng!Passw0rd";

    await page.goto("/auth/sign-up");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#confirm-password").fill(password);
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
    await expect(
      page.getByRole("heading", { name: "Choose your public handle" }),
    ).toBeVisible();

    await expect(async () => {
      const response = await fetch(`${FIRESTORE_DOCS_URL}/profiles`, {
        headers: { Authorization: "Bearer owner" },
      });
      const body: { documents?: FirestoreDocument[] } = await response.json();
      const doc = body.documents?.find(
        (candidate) => candidate.fields.email?.stringValue === email,
      );

      expect(doc).toBeTruthy();
      expect(doc?.fields.handle).toEqual({ nullValue: null });
    }).toPass({ timeout: 10000 });
  });

  test("shows a field error when the passwords don't match", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");
    await page.locator("#email").fill(`e2e-mismatch-${Date.now()}@example.com`);
    await page.locator("#password").fill("Str0ng!Passw0rd");
    await page.locator("#confirm-password").fill("Different!Passw0rd");
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();

    await expect(page.getByRole("alert").getByText("Passwords must match.")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  test("shows an email-specific error when the email is already registered", async ({
    page,
  }) => {
    const email = `e2e-duplicate-${Date.now()}@example.com`;
    await createEmulatedUser(email, "Str0ng!Passw0rd");

    await page.goto("/auth/sign-up");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("AnotherStr0ng!Pass");
    await page.locator("#confirm-password").fill("AnotherStr0ng!Pass");
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();

    await expect(
      page
        .getByRole("alert")
        .getByText("An account with this email already exists."),
    ).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });
});

test.describe("sign in with email/password", () => {
  test("signs in with valid credentials and redirects away from /auth/sign-in", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const email = `e2e-signin-${Date.now()}@example.com`;
    const password = "Str0ng!Passw0rd";
    await createEmulatedUser(email, password);

    await page.goto("/auth/sign-in");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page).toHaveURL(/\/onboarding|\/dashboard/, {
      timeout: 20000,
    });
  });

  test("shows a generic error for a wrong password without flagging either field", async ({
    page,
  }) => {
    const email = `e2e-wrongpass-${Date.now()}@example.com`;
    await createEmulatedUser(email, "Str0ng!Passw0rd");

    await page.goto("/auth/sign-in");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("TotallyWrongPassword1!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(
      page.getByRole("alert").getByText("Incorrect email or password."),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#email")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.locator("#password")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test("shows the same generic error for a non-existent email", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in");
    await page.locator("#email").fill(`e2e-nonexistent-${Date.now()}@example.com`);
    await page.locator("#password").fill("SomePassword123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(
      page.getByRole("alert").getByText("Incorrect email or password."),
    ).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
