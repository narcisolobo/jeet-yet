import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "jeet-yet-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const OWNER_UID = "owner-uid";
const OTHER_UID = "other-uid";
const RECIPE_ID = "recipe-1";

async function seedRecipe(ownerId: string = OWNER_UID) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "recipes", RECIPE_ID), {
      name: "Test Recipe",
      ownerId,
    });
  });
}

describe("recipes/{recipeId}", () => {
  test("an unauthenticated user can read a recipe", async () => {
    await seedRecipe();
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "recipes", RECIPE_ID)));
  });

  test("an unauthenticated user cannot create a recipe", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "recipes", RECIPE_ID), {
        name: "Test Recipe",
        ownerId: OWNER_UID,
      }),
    );
  });

  test("an authenticated user can create a recipe with themself as ownerId", async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(
      setDoc(doc(db, "recipes", RECIPE_ID), {
        name: "Test Recipe",
        ownerId: OWNER_UID,
      }),
    );
  });

  test("an authenticated user cannot create a recipe owned by someone else", async () => {
    const db = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(
      setDoc(doc(db, "recipes", RECIPE_ID), {
        name: "Test Recipe",
        ownerId: OWNER_UID,
      }),
    );
  });

  test("a client cannot set favoriteCount on create", async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      setDoc(doc(db, "recipes", RECIPE_ID), {
        name: "Test Recipe",
        ownerId: OWNER_UID,
        favoriteCount: 0,
      }),
    );
  });

  test("the owner can update their own recipe", async () => {
    await seedRecipe();
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(
      updateDoc(doc(db, "recipes", RECIPE_ID), { name: "Updated Recipe" }),
    );
  });

  test("a non-owner cannot update someone else's recipe", async () => {
    await seedRecipe();
    const db = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, "recipes", RECIPE_ID), { name: "Hijacked" }),
    );
  });

  test("the owner cannot change ownerId on update", async () => {
    await seedRecipe();
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, "recipes", RECIPE_ID), { ownerId: OTHER_UID }),
    );
  });

  test("a client cannot modify thumbsUpCount via update, even the owner", async () => {
    await seedRecipe();
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      updateDoc(doc(db, "recipes", RECIPE_ID), { thumbsUpCount: 1 }),
    );
  });

  test("the owner can delete their own recipe", async () => {
    await seedRecipe();
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(deleteDoc(doc(db, "recipes", RECIPE_ID)));
  });

  test("a non-owner cannot delete someone else's recipe", async () => {
    await seedRecipe();
    const db = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(deleteDoc(doc(db, "recipes", RECIPE_ID)));
  });
});

describe("recipes/{recipeId}/private/{ownerId}", () => {
  test("the owner can write their own private doc", async () => {
    await seedRecipe();
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(
      setDoc(doc(db, "recipes", RECIPE_ID, "private", OWNER_UID), {
        notes: "so good",
        ownerId: OWNER_UID,
      }),
    );
  });

  test("a different user cannot read another owner's private doc", async () => {
    await seedRecipe();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "recipes", RECIPE_ID, "private", OWNER_UID),
        { notes: "so good", ownerId: OWNER_UID },
      );
    });
    const db = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(
      getDoc(doc(db, "recipes", RECIPE_ID, "private", OWNER_UID)),
    );
  });
});

describe("recipes/{recipeId}/ratings/{userId}", () => {
  test("any authenticated user can write their own rating on someone else's recipe", async () => {
    await seedRecipe();
    const db = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertSucceeds(
      setDoc(doc(db, "recipes", RECIPE_ID, "ratings", OTHER_UID), {
        value: "up",
      }),
    );
  });

  test("a user cannot write a rating doc under someone else's uid", async () => {
    await seedRecipe();
    const db = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(
      setDoc(doc(db, "recipes", RECIPE_ID, "ratings", OWNER_UID), {
        value: "up",
      }),
    );
  });
});

describe("favoriteRecipes/{docId}", () => {
  const FAVORITE_ID = `${OTHER_UID}_${RECIPE_ID}`;

  test("an authenticated user can create a favorite with themself as userId", async () => {
    const db = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertSucceeds(
      setDoc(doc(db, "favoriteRecipes", FAVORITE_ID), {
        userId: OTHER_UID,
        recipeId: RECIPE_ID,
      }),
    );
  });

  test("an authenticated user cannot create a favorite for someone else", async () => {
    const db = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(
      setDoc(doc(db, "favoriteRecipes", FAVORITE_ID), {
        userId: OWNER_UID,
        recipeId: RECIPE_ID,
      }),
    );
  });

  test("the favoriting user can read their own favorite doc", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "favoriteRecipes", FAVORITE_ID), {
        userId: OTHER_UID,
        recipeId: RECIPE_ID,
      });
    });
    const db = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertSucceeds(getDoc(doc(db, "favoriteRecipes", FAVORITE_ID)));
  });

  test("a different user cannot read someone else's favorite doc", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "favoriteRecipes", FAVORITE_ID), {
        userId: OTHER_UID,
        recipeId: RECIPE_ID,
      });
    });
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(getDoc(doc(db, "favoriteRecipes", FAVORITE_ID)));
  });
});
