import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "jeet-yet-rules-test",
    storage: {
      rules: readFileSync("storage.rules", "utf8"),
      host: "localhost",
      port: 9199,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearStorage();
});

const OWNER_UID = "owner-uid";
const OTHER_UID = "other-uid";
const RECIPE_ID = "recipe-1";
const PHOTO_PATH = `recipes/${OWNER_UID}/${RECIPE_ID}/photo`;

const SMALL_IMAGE = new Uint8Array([1, 2, 3, 4]);
const OVERSIZED_IMAGE = new Uint8Array(6 * 1024 * 1024);

describe("recipes/{ownerId}/{recipeId}/{fileName}", () => {
  test("an unauthenticated user can read a photo", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(ref(context.storage(), PHOTO_PATH), SMALL_IMAGE, {
        contentType: "image/png",
      });
    });
    const storage = testEnv.unauthenticatedContext().storage();
    await assertSucceeds(getDownloadURL(ref(storage, PHOTO_PATH)));
  });

  test("the owner can upload a photo under their own uid", async () => {
    const storage = testEnv.authenticatedContext(OWNER_UID).storage();
    await assertSucceeds(
      uploadBytes(ref(storage, PHOTO_PATH), SMALL_IMAGE, {
        contentType: "image/png",
      }),
    );
  });

  test("a different authenticated user cannot upload under someone else's uid", async () => {
    const storage = testEnv.authenticatedContext(OTHER_UID).storage();
    await assertFails(
      uploadBytes(ref(storage, PHOTO_PATH), SMALL_IMAGE, {
        contentType: "image/png",
      }),
    );
  });

  test("an unauthenticated user cannot upload a photo", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(
      uploadBytes(ref(storage, PHOTO_PATH), SMALL_IMAGE, {
        contentType: "image/png",
      }),
    );
  });

  test("an oversized upload is rejected", async () => {
    const storage = testEnv.authenticatedContext(OWNER_UID).storage();
    await assertFails(
      uploadBytes(ref(storage, PHOTO_PATH), OVERSIZED_IMAGE, {
        contentType: "image/png",
      }),
    );
  });

  test("a non-image content type is rejected", async () => {
    const storage = testEnv.authenticatedContext(OWNER_UID).storage();
    await assertFails(
      uploadBytes(ref(storage, PHOTO_PATH), SMALL_IMAGE, {
        contentType: "application/pdf",
      }),
    );
  });
});
